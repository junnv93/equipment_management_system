import csv
import pandas as pd
from django.core.management.base import BaseCommand
from equipment.models import Equipment
from django.utils.dateparse import parse_date
import os
from datetime import datetime, timedelta
import re

class Command(BaseCommand):
    help = 'Import equipment from CSV or XLSX file'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the CSV or XLSX file')

    def handle(self, *args, **options):
        file_path = options['file_path']
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.csv':
            # CSV 파일 처리
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                # CSV의 경우 열 이름 매핑 생성
                column_mapping = self._create_column_mapping(reader.fieldnames)
                self._process_rows(reader, column_mapping)
        elif file_ext in ['.xlsx', '.xls']:
            # 엑셀 파일 구조 확인 - 첫 번째 행은 제목, 두 번째 행이 열 이름
            df_preview = pd.read_excel(file_path, header=1, nrows=5)  # 두 번째 행을 헤더로 사용
            self.stdout.write(f"Excel preview:\n{df_preview.head()}")
            
            # 실제 열 이름 출력
            self.stdout.write(f"Actual Excel columns: {list(df_preview.columns)}")
            
            # 두 번째 행을 헤더로 사용하여 데이터 읽기
            df = pd.read_excel(file_path, header=1)
            
            # 열 이름 매핑 생성
            column_mapping = self._create_column_mapping(df.columns)
            self.stdout.write(f"Column mapping: {column_mapping}")
            
            # 열 매핑 결과 확인
            if 'last_calibration_date' not in column_mapping:
                self.stdout.write(self.style.ERROR("'최종교정일' 열을 찾을 수 없습니다!"))
            else:
                self.stdout.write(f"'최종교정일' 열이 '{column_mapping['last_calibration_date']}'로 매핑되었습니다.")
            
            records = df.to_dict('records')
            self._process_rows(records, column_mapping)
        else:
            self.stdout.write(self.style.ERROR(f'Unsupported file format: {file_ext}'))
            return
            
        self.stdout.write(self.style.SUCCESS('Successfully imported equipment data'))
    
    def _create_column_mapping(self, columns):
        """열 이름에 키워드가 포함된 열을 찾아 매핑 생성"""
        mapping = {}
        
        # 키워드와 필드 이름 매핑
        keywords = {
            '관리번호': 'management_number',
            '자산번호': 'asset_number',
            '장비명': 'name',
            '관리방법': 'management_method',
            '최종교정일': 'last_calibration_date',
            '교정기관': 'calibration_institution',
            '교정주기': 'calibration_cycle',
            '차기교정일': 'next_calibration_date',
            '제조사': 'manufacturer',
            '구입년도': 'purchase_year',
            '모델명': 'model_name',
            '일련번호': 'serial_number',
            '장비사양': 'specifications',
            '위치': 'location',
            '중간점검 대상': 'intermediate_check',
            '가용 여부': 'status',
            '소속팀': 'team'
        }
        
        # 각 열 이름에 대해 키워드 검색
        for column in columns:
            column_str = str(column).strip()
            for keyword, field in keywords.items():
                if keyword in column_str:
                    mapping[field] = column
                    break
        
        # 매핑 결과 로깅
        self.stdout.write(f"Column mapping: {mapping}")
        return mapping
    
    def _process_rows(self, rows, column_mapping):
        imported_count = 0
        skipped_count = 0
        
        for row in rows:
            try:
                # 관리번호 가져오기
                management_number = self._get_value(row, column_mapping, 'management_number', '')
                
                # 관리번호가 비어있거나 NaN인 경우 건너뛰기
                if not management_number or pd.isna(management_number):
                    self.stdout.write(self.style.WARNING(f"관리번호가 비어있습니다. 행을 건너뜁니다: {row}"))
                    skipped_count += 1
                    continue
                
                # 팀 정보 가져오기 (기본값은 RF팀)
                team_value = self._get_value(row, column_mapping, 'team', '')
                if pd.isna(team_value) or not team_value:
                    # 관리번호로 팀 추론
                    if str(management_number).startswith('SUW-E'):
                        team = 'RF'
                    elif str(management_number).startswith('SUW-S'):
                        team = 'SAR'
                    elif str(management_number).startswith('SUW-R'):
                        team = 'EMC'
                    elif str(management_number).startswith('SUW-A'):
                        team = 'AUTO'
                    else:
                        team = 'RF'  # 기본값
                elif 'SAR' in str(team_value).upper():
                    team = 'SAR'
                elif 'EMC' in str(team_value).upper():
                    team = 'EMC'
                elif 'AUTO' in str(team_value).upper() or 'AUTOMOTIVE' in str(team_value).upper():
                    team = 'AUTO'
                else:
                    team = 'RF'
                
                # 관리번호 형식 검사
                prefix_map = {
                    'RF': 'SUW-E',
                    'SAR': 'SUW-S',
                    'EMC': 'SUW-R',
                    'AUTO': 'SUW-A'
                }
                expected_prefix = prefix_map[team]
                if not str(management_number).startswith(expected_prefix):
                    self.stdout.write(self.style.WARNING(f"{team}팀 장비는 관리번호가 '{expected_prefix}'로 시작해야 합니다. '{management_number}'는 올바르지 않습니다. 행을 건너뜁니다."))
                    skipped_count += 1
                    continue
                
                # 중복 검사 및 업데이트 로직
                existing_equipment = Equipment.objects.filter(management_number=management_number).first()
                if existing_equipment:
                    # 기존 장비 업데이트
                    self.stdout.write(self.style.WARNING(f"관리번호 '{management_number}'가 이미 존재합니다. 데이터를 업데이트합니다."))
                    self._update_equipment(existing_equipment, row, column_mapping, team)
                    imported_count += 1
                    continue
                
                # 매핑된 열 이름으로 데이터 가져오기
                last_cal_date_value = self._get_value(row, column_mapping, 'last_calibration_date')
                self.stdout.write(f"최종교정일 원본 값: '{last_cal_date_value}'")
                last_cal_date = self._parse_date_safely(last_cal_date_value)
                self.stdout.write(f"최종교정일 파싱 결과: {last_cal_date}")
                
                next_cal_date_value = self._get_value(row, column_mapping, 'next_calibration_date')
                self.stdout.write(f"차기교정일 원본 값: '{next_cal_date_value}'")
                next_cal_date = self._parse_date_safely(next_cal_date_value)
                self.stdout.write(f"차기교정일 파싱 결과: {next_cal_date}")
                
                # 교정주기 처리
                cal_cycle_value = self._get_value(row, column_mapping, 'calibration_cycle')
                try:
                    if pd.isna(cal_cycle_value) or cal_cycle_value == 'N/A':
                        cal_cycle = 0
                    else:
                        # 문자열로 변환하고 공백 제거
                        cal_cycle_str = str(cal_cycle_value).strip()
                        
                        # 숫자만 추출하는 정규식 사용
                        numbers_only = re.findall(r'\d+', cal_cycle_str)
                        
                        if numbers_only:
                            # 첫 번째 숫자 그룹 사용
                            cal_cycle = int(numbers_only[0])
                        else:
                            # 숫자를 찾을 수 없는 경우
                            cal_cycle = 0
                            self.stdout.write(self.style.WARNING(f"교정주기 값 '{cal_cycle_value}'에서 숫자를 찾을 수 없습니다. 0으로 설정합니다."))
                except (ValueError, TypeError) as e:
                    cal_cycle = 0
                    self.stdout.write(self.style.WARNING(f"교정주기 값 '{cal_cycle_value}'를 숫자로 변환할 수 없습니다. 오류: {str(e)}. 0으로 설정합니다."))
                
                # 중간점검 대상 처리
                intermediate_check_value = self._get_value(row, column_mapping, 'intermediate_check')
                intermediate_check = intermediate_check_value == 'O'
                
                # 상태 처리 (가용 여부 기준)
                status_value = self._get_value(row, column_mapping, 'status')
                if status_value == '사용':
                    status = 'available'
                elif status_value == '고장':
                    status = 'repair'
                elif status_value == '여분':
                    status = 'spare'
                else:
                    status = 'available'  # 기본값
                
                # 자산번호 처리
                asset_number = self._get_value(row, column_mapping, 'asset_number')
                if asset_number == 'N/A':
                    asset_number = ''
                
                # 구입년도 처리 (비어 있는 경우 None으로 설정)
                purchase_year_value = self._get_value(row, column_mapping, 'purchase_year', None)
                if purchase_year_value and not pd.isna(purchase_year_value):
                    try:
                        purchase_year = int(purchase_year_value)
                        if purchase_year <= 0:
                            purchase_year = None
                    except (ValueError, TypeError):
                        purchase_year = None
                else:
                    purchase_year = None
                
                # 관리방법 처리
                management_method_value = self._get_value(row, column_mapping, 'management_method', '')
                if '외부교정' in str(management_method_value):
                    management_method = 'external_calibration'
                elif '자체점검' in str(management_method_value):
                    management_method = 'self_check'
                    # 자체점검인 경우 로그 추가
                    if last_cal_date:
                        self.stdout.write(self.style.WARNING(f"관리방법이 '자체점검'이므로 최종교정일 '{last_cal_date}'가 None으로 설정됩니다."))
                    last_cal_date = None
                    next_cal_date = None
                elif '비대상' in str(management_method_value):
                    management_method = 'not_applicable'
                    # 비대상인 경우 로그 추가
                    if last_cal_date:
                        self.stdout.write(self.style.WARNING(f"관리방법이 '비대상'이므로 최종교정일 '{last_cal_date}'가 None으로 설정됩니다."))
                    last_cal_date = None
                    next_cal_date = None
                else:
                    management_method = 'external_calibration'  # 기본값
                
                # 교정일자 기반 상태 계산
                if management_method == 'external_calibration' and next_cal_date:
                    today = datetime.now().date()
                    days_until_calibration = (next_cal_date - today).days
                    
                    if days_until_calibration <= 0:
                        status = 'calibration_overdue'  # 교정 기한 지남
                    elif days_until_calibration <= 30:
                        status = 'calibration_soon'  # 교정 기한 임박 (30일 이내)
                
                Equipment.objects.create(
                    name=self._get_value(row, column_mapping, 'name', ''),
                    management_number=management_number,
                    model_name=self._get_value(row, column_mapping, 'model_name', ''),
                    manufacturer=self._get_value(row, column_mapping, 'manufacturer', ''),
                    location=self._get_value(row, column_mapping, 'location', ''),
                    calibration_cycle=cal_cycle,
                    last_calibration_date=last_cal_date,
                    next_calibration_date=next_cal_date,
                    calibration_institution=self._get_value(row, column_mapping, 'calibration_institution', ''),
                    serial_number=self._get_value(row, column_mapping, 'serial_number', ''),
                    specifications=self._get_value(row, column_mapping, 'specifications', ''),
                    status=status,
                    asset_number=asset_number,
                    management_method=management_method,
                    purchase_year=purchase_year,
                    intermediate_check=intermediate_check,
                    team=team
                )
                self.stdout.write(self.style.SUCCESS(f"장비 '{management_number}'를 성공적으로 가져왔습니다."))
                imported_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error importing row: {row}. Error: {str(e)}'))
                skipped_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'총 {imported_count}개의 장비 데이터를 가져왔습니다. {skipped_count}개의 행을 건너뛰었습니다.'))
    
    def _update_equipment(self, equipment, row, column_mapping, team=None):
        """기존 장비 데이터 업데이트"""
        try:
            # 매핑된 열 이름으로 데이터 가져오기
            last_cal_date_value = self._get_value(row, column_mapping, 'last_calibration_date')
            self.stdout.write(f"최종교정일 원본 값: '{last_cal_date_value}'")
            last_cal_date = self._parse_date_safely(last_cal_date_value)
            self.stdout.write(f"최종교정일 파싱 결과: {last_cal_date}")
            
            next_cal_date_value = self._get_value(row, column_mapping, 'next_calibration_date')
            self.stdout.write(f"차기교정일 원본 값: '{next_cal_date_value}'")
            next_cal_date = self._parse_date_safely(next_cal_date_value)
            self.stdout.write(f"차기교정일 파싱 결과: {next_cal_date}")
            
            # 교정주기 처리
            cal_cycle_value = self._get_value(row, column_mapping, 'calibration_cycle')
            try:
                if pd.isna(cal_cycle_value) or cal_cycle_value == 'N/A':
                    cal_cycle = 0
                else:
                    # 문자열로 변환하고 공백 제거
                    cal_cycle_str = str(cal_cycle_value).strip()
                    
                    # 숫자만 추출하는 정규식 사용
                    numbers_only = re.findall(r'\d+', cal_cycle_str)
                    
                    if numbers_only:
                        # 첫 번째 숫자 그룹 사용
                        cal_cycle = int(numbers_only[0])
                    else:
                        # 숫자를 찾을 수 없는 경우
                        cal_cycle = 0
                        self.stdout.write(self.style.WARNING(f"교정주기 값 '{cal_cycle_value}'에서 숫자를 찾을 수 없습니다. 0으로 설정합니다."))
            except (ValueError, TypeError) as e:
                cal_cycle = 0
                self.stdout.write(self.style.WARNING(f"교정주기 값 '{cal_cycle_value}'를 숫자로 변환할 수 없습니다. 오류: {str(e)}. 0으로 설정합니다."))
            
            # 중간점검 대상 처리
            intermediate_check_value = self._get_value(row, column_mapping, 'intermediate_check')
            intermediate_check = intermediate_check_value == 'O'
            
            # 상태 처리 (가용 여부 기준)
            status_value = self._get_value(row, column_mapping, 'status')
            if status_value == '사용':
                status = 'available'
            elif status_value == '고장':
                status = 'repair'
            elif status_value == '여분':
                status = 'spare'
            else:
                status = equipment.status  # 기존 값 유지
            
            # 자산번호 처리
            asset_number = self._get_value(row, column_mapping, 'asset_number')
            if asset_number == 'N/A':
                asset_number = ''
            
            # 구입년도 처리
            purchase_year_value = self._get_value(row, column_mapping, 'purchase_year', None)
            if purchase_year_value and not pd.isna(purchase_year_value):
                try:
                    purchase_year = int(purchase_year_value)
                    if purchase_year <= 0:
                        purchase_year = None
                except (ValueError, TypeError):
                    purchase_year = equipment.purchase_year  # 기존 값 유지
            else:
                purchase_year = equipment.purchase_year  # 기존 값 유지
            
            # 관리방법 처리
            management_method_value = self._get_value(row, column_mapping, 'management_method', '')
            if '외부교정' in str(management_method_value):
                management_method = 'external_calibration'
            elif '자체점검' in str(management_method_value):
                management_method = 'self_check'
                # 자체점검인 경우 로그 추가
                if last_cal_date:
                    self.stdout.write(self.style.WARNING(f"관리방법이 '자체점검'이므로 최종교정일 '{last_cal_date}'가 None으로 설정됩니다."))
                last_cal_date = None
                next_cal_date = None
            elif '비대상' in str(management_method_value):
                management_method = 'not_applicable'
                # 비대상인 경우 로그 추가
                if last_cal_date:
                    self.stdout.write(self.style.WARNING(f"관리방법이 '비대상'이므로 최종교정일 '{last_cal_date}'가 None으로 설정됩니다."))
                last_cal_date = None
                next_cal_date = None
            else:
                management_method = 'external_calibration'  # 기본값
            
            # 교정일자 기반 상태 계산
            if management_method == 'external_calibration' and next_cal_date:
                today = datetime.now().date()
                days_until_calibration = (next_cal_date - today).days
                
                if days_until_calibration <= 0:
                    status = 'calibration_overdue'  # 교정 기한 지남
                elif days_until_calibration <= 30:
                    status = 'calibration_soon'  # 교정 기한 임박 (30일 이내)
            
            # 필드 업데이트
            equipment.name = self._get_value(row, column_mapping, 'name', '') or equipment.name
            equipment.model_name = self._get_value(row, column_mapping, 'model_name', '') or equipment.model_name
            equipment.manufacturer = self._get_value(row, column_mapping, 'manufacturer', '') or equipment.manufacturer
            equipment.location = self._get_value(row, column_mapping, 'location', '') or equipment.location
            equipment.calibration_cycle = cal_cycle
            equipment.last_calibration_date = last_cal_date
            equipment.next_calibration_date = next_cal_date
            equipment.calibration_institution = self._get_value(row, column_mapping, 'calibration_institution', '') or equipment.calibration_institution
            equipment.serial_number = self._get_value(row, column_mapping, 'serial_number', '') or equipment.serial_number
            equipment.specifications = self._get_value(row, column_mapping, 'specifications', '') or equipment.specifications
            equipment.status = status
            equipment.asset_number = asset_number
            equipment.management_method = management_method
            equipment.purchase_year = purchase_year
            equipment.intermediate_check = intermediate_check
            equipment.team = team
            
            # 변경사항 저장
            equipment.save()
            
            return True
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'장비 업데이트 중 오류 발생: {str(e)}'))
            return False
    
    def _get_value(self, row, mapping, field, default=''):
        """매핑된 열 이름으로 행에서 값 가져오기"""
        if field in mapping and mapping[field] in row:
            value = row[mapping[field]]
            # NaN 값 처리
            if pd.isna(value):
                return default
            return value
        return default
    
    def _parse_date_safely(self, date_value):
        """안전하게 날짜를 파싱하는 함수"""
        if not date_value or date_value == 'N/A' or pd.isna(date_value):
            self.stdout.write(self.style.WARNING(f"날짜 값 '{date_value}'가 비어 있거나 'N/A'입니다. None으로 설정합니다."))
            return None
        
        # datetime 객체인 경우
        if isinstance(date_value, datetime):
            return date_value.date()
        
        # 문자열로 변환
        date_str = str(date_value).strip()
        
        # 날짜 형식이 YYYY-MM-DD인 경우
        try:
            return parse_date(date_str)
        except Exception:
            pass
        
        # 날짜와 시간 형식이 YYYY-MM-DD HH:MM:SS인 경우
        try:
            return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S').date()
        except Exception:
            pass
        
        # 날짜 형식이 다른 경우 (예: 2024-07-23)
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            pass
        
        # 다른 형식 시도 (예: 23-07-2024)
        try:
            return datetime.strptime(date_str, '%d-%m-%Y').date()
        except Exception:
            pass
        
        # 엑셀 날짜 형식 (숫자) 처리
        try:
            # 엑셀 날짜 시작점: 1900년 1월 1일
            excel_epoch = datetime(1900, 1, 1)
            if isinstance(date_value, (int, float)):
                # 엑셀 날짜 버그 처리 (1900년 2월 29일이 존재하지 않음)
                if date_value > 59:
                    date_value -= 1
                return (excel_epoch + timedelta(days=date_value - 1)).date()
        except Exception:
            pass
        
        # 모든 시도 실패
        self.stdout.write(self.style.ERROR(f"날짜 값 '{date_value}'를 파싱할 수 없습니다. None으로 설정합니다."))
        return None