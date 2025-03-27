#equipment/views.py
import logging
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from datetime import timedelta
from django.http import HttpResponse
from django.core.mail import send_mail
from django.conf import settings
import pandas as pd
import csv
from django.contrib.auth import authenticate
from .models import Equipment, EquipmentLoan, User, Notification, CalibrationHistory, EquipmentCheckout, EquipmentLocationHistory, MaintenanceHistory, RepairHistory, CheckoutEquipment
from .serializers import (
    EquipmentSerializer, 
    EquipmentLoanSerializer, 
    UserSerializer,
    EquipmentDetailSerializer, 
    CalibrationHistorySerializer,
    NotificationSerializer, 
    EquipmentCheckoutSerializer,
    EquipmentLocationHistorySerializer,
    MaintenanceHistorySerializer,
    RepairHistorySerializer
)
from django.db import transaction
from django.db import IntegrityError
from rest_framework.pagination import PageNumberPagination
import datetime
from django.core.cache import cache

logger = logging.getLogger(__name__)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'pageSize'
    max_page_size = 500

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post', 'get'])
    def login(self, request):
        if request.method == 'GET':
            return Response({'message': '로그인 페이지입니다. POST 요청으로 username과 password를 전송하세요.'})
            
        username = request.data.get('username')
        password = request.data.get('password')
        print(f"Login attempt: username={username}, password={password}")  # 디버그 출력
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            logger.info(f"User {username} logged in successfully.")
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        logger.warning(f"Login failed for user {username}.")
        print("Authentication failed")  # 디버그 출력
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("User logged out successfully.")
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all().order_by('management_number')
    serializer_class = EquipmentSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'location', 'manufacturer', 'team']
    search_fields = ['name', 'management_number', 'model_name', 'serial_number', 'asset_number', 'specifications', 'location']
    ordering_fields = ['name', 'last_calibration_date', 'next_calibration_date', 'team']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EquipmentDetailSerializer
        return EquipmentSerializer

    @action(detail=True, methods=['get'])
    def calibration_history(self, request, pk=None):
        equipment = self.get_object()
        calibration_history = equipment.calibration_history.all()
        serializer = CalibrationHistorySerializer(calibration_history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_calibration(self, request, pk=None):
        equipment = self.get_object()
        print("Received data:", request.data)
        
        try:
            # 교정일 가져오기
            calibration_date = request.data.get('calibration_date')
            if not calibration_date:
                return Response(
                    {"error": "교정일은 필수 항목입니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 교정 주기를 기반으로 차기교정일 자동 계산
            if equipment.calibration_cycle:
                from datetime import datetime
                from dateutil.relativedelta import relativedelta
                
                cal_date = datetime.strptime(calibration_date, '%Y-%m-%d')
                next_date = cal_date + relativedelta(months=equipment.calibration_cycle)
                next_calibration_date = next_date.strftime('%Y-%m-%d')
            else:
                # 교정 주기가 없는 경우 오류 반환
                return Response(
                    {"error": "장비의 교정 주기가 설정되어 있지 않습니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 교정 이력 데이터 준비
            calibration_data = {
                'calibration_date': calibration_date,
                'next_calibration_date': next_calibration_date,  # 자동 계산된 차기교정일
                'institution': request.data.get('institution'),
                'result': request.data.get('result', '적합')
            }
            
            serializer = CalibrationHistorySerializer(data=calibration_data)
            
            if serializer.is_valid():
                # equipment를 create 메서드에서 직접 설정
                calibration = CalibrationHistory.objects.create(
                    equipment=equipment,
                    **serializer.validated_data
                )
                
                # 과거 교정 이력 추가인 경우 장비의 최종 교정일을 업데이트하지 않음
                is_historical = request.data.get('is_historical', False)
                
                if not is_historical:
                    # 현재 교정인 경우에만 장비의 최종 교정일과 교정기관 업데이트
                    equipment.last_calibration_date = calibration.calibration_date
                    equipment.calibration_institution = calibration.institution
                    equipment.save()
                
                # 생성된 교정 이력 데이터 반환
                return Response(
                    CalibrationHistorySerializer(calibration).data,
                    status=status.HTTP_201_CREATED
                )
            
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print("Error:", str(e))
            return Response(
                {"error": f"교정 이력 추가 중 오류가 발생했습니다: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def add_location_history(self, request, pk=None):
        equipment = self.get_object()
        
        # 요청 데이터 검증
        location = request.data.get('location')
        notes = request.data.get('notes', '')
        change_date = request.data.get('change_date')  # 변동일시 추가
        
        if not location:
            return Response({"detail": "위치는 필수 입력 항목입니다."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 위치 이력 생성
            location_history_data = {
                'equipment': equipment,
                'location': location,
                'notes': notes
            }
            
            # 변동일시가 제공된 경우 추가
            if change_date:
                # 날짜만 사용 (모델이 DateField인 경우)
                from datetime import datetime
                date_only = datetime.strptime(change_date, '%Y-%m-%d').date()
                location_history_data['change_date'] = date_only
            
            location_history = EquipmentLocationHistory.objects.create(**location_history_data)
            
            # 장비 위치 업데이트
            equipment.location = location
            equipment.save()
            
            return Response(EquipmentLocationHistorySerializer(location_history).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return Response({"error": f"Failed to read Excel file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        success_count = 0
        error_records = []

        for _, row in df.iterrows():
            try:
                Equipment.objects.update_or_create(
                    management_number=row['management_number'],
                    defaults={
                        'name': row['name'],
                        'model_name': row['model_name'],
                        'manufacturer': row['manufacturer'],
                        'location': row['location'],
                        'calibration_cycle': row['calibration_cycle'],
                        'last_calibration_date': row['last_calibration_date'],
                        'next_calibration_date': row['next_calibration_date'],
                        'status': row['status'],
                        'calibration_institution': row.get('calibration_institution', ''),
                        'serial_number': row.get('serial_number', ''),
                        'specifications': row.get('specifications', ''),
                    }
                )
                success_count += 1
            except IntegrityError as e:
                # datetime 객체를 문자열로 변환하여 JSON 직렬화 가능하도록 함
                row_dict = {}
                for key, value in row.to_dict().items():
                    if isinstance(value, datetime.datetime):
                        row_dict[key] = value.isoformat()
                    elif isinstance(value, datetime.date):  # datetime.date 객체도 처리
                        row_dict[key] = value.isoformat()
                    else:
                        row_dict[key] = value
                
                error_records.append({
                    'row': row_dict,
                    'error': f"Integrity Error: {str(e)}"
                })
            except Exception as e:
                # datetime 객체를 문자열로 변환하여 JSON 직렬화 가능하도록 함
                row_dict = {}
                for key, value in row.to_dict().items():
                    if isinstance(value, datetime.datetime):
                        row_dict[key] = value.isoformat()
                    elif isinstance(value, datetime.date):  # datetime.date 객체도 처리
                        row_dict[key] = value.isoformat()
                    else:
                        row_dict[key] = value
                
                error_records.append({
                    'row': row_dict,
                    'error': f"Unexpected Error: {str(e)}"
                })
                logger.error(f"Error importing row: {row}. Error: {str(e)}")

        return Response({
            'message': f'Import completed. {success_count} records imported successfully.',
            'errors': error_records
        })

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        df = pd.DataFrame(list(queryset.values()))
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=equipment_export.xlsx'
        
        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Equipment')
        
        return response

    @action(detail=True, methods=['post'])
    def borrow(self, request, pk=None):
        try:
            equipment = self.get_object()
            logger.debug(f"Received borrow request for equipment {pk}: {request.data}")
            
            # 장비가 대여 가능한지 확인
            available_statuses = ['available', 'calibration_soon']
            if equipment.status not in available_statuses:
                logger.warning(f"Equipment {pk} is not available for borrowing. Current status: {equipment.status}")
                return Response(
                    {"error": "장비가 대여 가능한 상태가 아닙니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = EquipmentLoanSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                loan = serializer.save(equipment=equipment, borrower=request.user)
                
                # borrowed_date 처리 로직 개선
                if loan.borrowed_date is None:
                    loan.borrowed_date = loan.loan_date.date()
                    loan.save()
                    logger.info(f"Set borrowed_date from loan_date for loan ID {loan.id}")
                
                # 장비 상태 변경
                equipment.status = 'borrowed'
                
                # 장비 객체에 대여 정보 직접 추가
                equipment.borrower = request.user.id
                equipment.borrower_name = loan.borrower_name
                equipment.borrower_department = loan.borrower_department
                equipment.borrowed_date = loan.borrowed_date
                equipment.expected_return_date = loan.expected_return_date
                equipment.save()
                
                logger.info(f"Equipment {pk} successfully borrowed by user {request.user.id}")
                
                # 대여 정보를 포함한 장비 데이터 반환
                equipment_serializer = EquipmentDetailSerializer(equipment, context={'request': request})
                return Response(equipment_serializer.data, status=status.HTTP_201_CREATED)
            
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error borrowing equipment {pk}: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def return_equipment(self, request, pk=None):
        try:
            equipment = self.get_object()
            logger.debug(f"Received return request for equipment {pk}: {request.data}")
            
            # 장비가 대여 중이거나 반출 중인지 확인
            if equipment.status not in ['borrowed', 'checked_out']:
                logger.warning(f"Equipment {pk} is not borrowed or checked out. Current status: {equipment.status}")
                return Response(
                    {"error": "대여 중이거나 반출 중인 장비만 반납할 수 있습니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if equipment.status == 'borrowed':
                # 대여 중인 경우 처리
                try:
                    # 가장 최근의 반납되지 않은 대여 기록 찾기
                    loan = EquipmentLoan.objects.filter(
                        equipment=equipment, 
                        return_date__isnull=True
                    ).latest('loan_date')
                    
                    # 반납일 설정
                    loan.return_date = timezone.now()
                    loan.returned_to = request.data.get('returned_to', 'system')
                    loan.save()
                    
                    logger.info(f"Equipment {pk} successfully returned")
                    
                    # 장비 상태를 '사용 가능'으로 업데이트
                    equipment.status = 'available'
                    
                    # 대여 정보 필드 초기화
                    equipment.borrower = None
                    equipment.borrower_name = None
                    equipment.borrower_department = None
                    equipment.borrowed_date = None
                    equipment.expected_return_date = None
                    
                    equipment.save()
                    
                    serializer = EquipmentDetailSerializer(equipment, context={'request': request})
                    return Response(serializer.data)
                    
                except EquipmentLoan.DoesNotExist:
                    logger.warning(f"No active loan found for equipment {pk}")
                    
                    # 대여 기록은 없지만 상태는 대여 중인 경우 상태만 변경
                    equipment.status = 'available'
                    
                    # 대여 정보 필드 초기화
                    equipment.borrower = None
                    equipment.borrower_name = None
                    equipment.borrower_department = None
                    equipment.borrowed_date = None
                    equipment.expected_return_date = None
                    
                    equipment.save()
                    
                    serializer = EquipmentDetailSerializer(equipment, context={'request': request})
                    return Response(
                        serializer.data,
                        status=status.HTTP_200_OK
                    )
            elif equipment.status == 'checked_out':
                # 반출 중인 경우 반출 기록 업데이트
                try:
                    # 이 장비와 관련된 반출 기록 찾기
                    checkout_equipment = CheckoutEquipment.objects.filter(
                        equipment=equipment, 
                        checkout__return_date__isnull=True
                    ).first()
                    
                    if checkout_equipment:
                        checkout = checkout_equipment.checkout
                        checkout.return_date = timezone.now().date()
                        checkout.returned_to = request.data.get('returned_to', 'system')
                        checkout.save()
                        logger.info(f"Equipment {pk} successfully returned from checkout")
                    else:
                        logger.warning(f"No active checkout found for equipment {pk}")
                except Exception as e:
                    logger.error(f"Error updating checkout record: {str(e)}")
            
            return Response({"message": "장비가 성공적으로 반납되었습니다."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error returning equipment {pk}: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch', 'put'], url_path='calibration_history/(?P<calibration_id>[^/.]+)')
    def update_calibration_history(self, request, pk=None, calibration_id=None):
        try:
            equipment = self.get_object()
            print(f"Updating calibration history for equipment {equipment.id}, calibration_id {calibration_id}")
            print(f"Request data: {request.data}")
            print(f"Request method: {request.method}")
            print(f"Request headers: {request.headers}")
            print(f"Request user: {request.user}")
            print(f"Request auth: {request.auth}")
            
            try:
                calibration = CalibrationHistory.objects.get(id=calibration_id, equipment=equipment)
                print(f"Found calibration history: {calibration.id}")
                print(f"Calibration history details: {calibration.__dict__}")
            except CalibrationHistory.DoesNotExist:
                print(f"Calibration history not found: {calibration_id}")
                return Response(
                    {"detail": "교정 이력을 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # 요청 데이터 복사 및 equipment 필드 설정
            data = request.data.copy()
            data['equipment'] = equipment.id
            print(f"Modified request data: {data}")
            
            # 결과 필드만 수정 가능
            if 'result' in data:
                calibration.result = data['result']
                calibration.save()
                print(f"Calibration history updated successfully")
            
            return Response(
                CalibrationHistorySerializer(calibration).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"Error updating calibration history: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"교정 이력 수정 중 오류가 발생했습니다: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['delete'], url_path='calibration_history/(?P<calibration_id>[^/.]+)')
    def delete_calibration_history(self, request, pk=None, calibration_id=None):
        try:
            equipment = self.get_object()
            calibration = CalibrationHistory.objects.get(id=calibration_id, equipment=equipment)
            
            # 교정 이력 삭제
            calibration.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CalibrationHistory.DoesNotExist:
            return Response(
                {"error": "해당 교정 이력을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"교정 이력 삭제 중 오류가 발생했습니다: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # 기존 last_calibration_date 값 저장
        old_last_calibration_date = instance.last_calibration_date
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # 업데이트된 인스턴스 가져오기
        updated_instance = self.get_object()
        
        # 디버깅을 위한 로그 추가
        print(f"Old date: {old_last_calibration_date}, New date: {updated_instance.last_calibration_date}")
        print(f"Types - Old: {type(old_last_calibration_date)}, New: {type(updated_instance.last_calibration_date)}")
        print(f"Are they equal? {old_last_calibration_date == updated_instance.last_calibration_date}")
        
        # last_calibration_date가 변경되었고, 값이 있는 경우 교정 이력 추가
        # 문자열로 변환하여 비교
        old_date_str = str(old_last_calibration_date) if old_last_calibration_date else None
        new_date_str = str(updated_instance.last_calibration_date) if updated_instance.last_calibration_date else None
        
        if new_date_str and old_date_str != new_date_str:
            print(f"Creating calibration history with date: {updated_instance.last_calibration_date}")
            # 교정 이력 생성
            calibration_history = CalibrationHistory.objects.create(
                equipment=updated_instance,
                calibration_date=updated_instance.last_calibration_date,
                result='적합',  # 기본값
                next_calibration_date=updated_instance.next_calibration_date,
                institution=updated_instance.calibration_institution or '자체교정'
            )
            print(f"Created calibration history: {calibration_history.id}")
        
        return Response(serializer.data)

    @action(detail=True, methods=['patch', 'put'], url_path='location_history/(?P<location_id>[^/.]+)')
    def update_location_history(self, request, pk=None, location_id=None):
        equipment = self.get_object()
        print(f"Updating location history for equipment {equipment.id}, location_id {location_id}")
        print(f"Request data: {request.data}")
        print(f"Request method: {request.method}")
        print(f"Request headers: {request.headers}")
        print(f"Request user: {request.user}")
        print(f"Request auth: {request.auth}")
        
        try:
            location_history = EquipmentLocationHistory.objects.get(id=location_id, equipment=equipment)
            print(f"Found location history: {location_history.id}")
            print(f"Location history details: {location_history.__dict__}")
        except EquipmentLocationHistory.DoesNotExist:
            print(f"Location history not found: {location_id}")
            return Response({"detail": "위치 변동 이력을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # 요청 데이터 복사 및 equipment 필드 설정
            data = request.data.copy()
            data['equipment'] = equipment.id
            print(f"Modified request data: {data}")
            
            # 요청 데이터 검증
            location = data.get('location')
            notes = data.get('notes', '')
            change_date = data.get('change_date')
            
            if not location:
                print("Location is required")
                return Response({"detail": "위치는 필수 입력 항목입니다."}, status=status.HTTP_400_BAD_REQUEST)
            
            if not change_date:
                print("Change date is required")
                return Response({"detail": "변동일시는 필수 입력 항목입니다."}, status=status.HTTP_400_BAD_REQUEST)
            
            # 위치 변동 이력 업데이트
            location_history.location = location
            location_history.notes = notes
            location_history.change_date = change_date
            location_history.save()
            
            print(f"Location history updated successfully")
            
            # 장비의 현재 위치 업데이트 (가장 최근 위치 변동 이력으로)
            latest_location = EquipmentLocationHistory.objects.filter(equipment=equipment).order_by('-change_date').first()
            if latest_location:
                equipment.location = latest_location.location
                equipment.save()
            
            return Response(EquipmentLocationHistorySerializer(location_history).data)
        except Exception as e:
            print(f"Error updating location history: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='location_history/(?P<location_id>[^/.]+)')
    def delete_location_history(self, request, pk=None, location_id=None):
        equipment = self.get_object()
        
        try:
            location_history = EquipmentLocationHistory.objects.get(id=location_id, equipment=equipment)
        except EquipmentLocationHistory.DoesNotExist:
            return Response({"detail": "위치 변동 이력을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            # 위치 이력 삭제
            location_history.delete()
            
            # 가장 최근 위치 이력으로 장비 위치 업데이트
            latest_history = equipment.location_history.order_by('-change_date').first()
            if latest_history:
                equipment.location = latest_history.location
                equipment.save()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_maintenance(self, request, pk=None):
        """
        장비 유지보수 이력 추가 API
        """
        try:
            equipment = self.get_object()
            
            # 시리얼라이저로 데이터 검증
            serializer = MaintenanceHistorySerializer(data={
                **request.data,
                'equipment': equipment.id
            })
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error adding maintenance history: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch', 'put'], url_path='maintenance/(?P<maintenance_id>[^/.]+)')
    def update_maintenance(self, request, pk=None, maintenance_id=None):
        """
        장비 유지보수 이력 수정 API
        """
        try:
            equipment = self.get_object()
            print(f"Updating maintenance history for equipment {equipment.id}, maintenance_id {maintenance_id}")
            print(f"Request data: {request.data}")
            print(f"Request method: {request.method}")
            print(f"Request headers: {request.headers}")
            print(f"Request user: {request.user}")
            print(f"Request auth: {request.auth}")
            
            try:
                maintenance = MaintenanceHistory.objects.get(id=maintenance_id, equipment=equipment)
                print(f"Found maintenance history: {maintenance.id}")
                print(f"Maintenance history details: {maintenance.__dict__}")
            except MaintenanceHistory.DoesNotExist:
                print(f"Maintenance history not found: {maintenance_id}")
                return Response({"error": "해당 유지보수 이력을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
            
            # 요청 데이터 복사 및 equipment 필드 설정
            data = request.data.copy()
            data['equipment'] = equipment.id
            print(f"Modified request data: {data}")
            
            serializer = MaintenanceHistorySerializer(maintenance, data=data, partial=True)
            
            if serializer.is_valid():
                print(f"Serializer is valid. Validated data: {serializer.validated_data}")
                serializer.save()
                print(f"Maintenance history updated successfully")
                return Response(serializer.data)
            else:
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error updating maintenance history: {str(e)}")
            import traceback
            traceback.print_exc()
            logger.error(f"Error updating maintenance history: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'], url_path='maintenance/(?P<maintenance_id>[^/.]+)')
    def delete_maintenance(self, request, pk=None, maintenance_id=None):
        """
        장비 유지보수 이력 삭제 API
        """
        try:
            equipment = self.get_object()
            
            try:
                maintenance = MaintenanceHistory.objects.get(id=maintenance_id, equipment=equipment)
            except MaintenanceHistory.DoesNotExist:
                return Response({"error": "해당 유지보수 이력을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
            
            maintenance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting maintenance history: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def add_repair(self, request, pk=None):
        """
        장비 손상/수리 이력 추가 API
        """
        try:
            equipment = self.get_object()
            
            # 디버깅 로그 추가
            print("Received repair data:", request.data)
            
            # 시리얼라이저로 데이터 검증
            serializer_data = {
                **request.data,
                'equipment': equipment.id
            }
            print("Serializer data:", serializer_data)
            
            serializer = RepairHistorySerializer(data=serializer_data)
            
            if serializer.is_valid():
                print("Serializer is valid")
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error adding repair history: {str(e)}")
            logger.error(f"Error adding repair history: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch', 'put'], url_path='repair_history/(?P<repair_id>[^/.]+)')
    def update_repair(self, request, pk=None, repair_id=None):
        """
        장비 손상/수리 이력 수정 API
        """
        try:
            equipment = self.get_object()
            print(f"Updating repair history for equipment {equipment.id}, repair_id {repair_id}")
            print(f"Request data: {request.data}")
            print(f"Request method: {request.method}")
            print(f"Request headers: {request.headers}")
            print(f"Request user: {request.user}")
            print(f"Request auth: {request.auth}")
            
            try:
                repair = RepairHistory.objects.get(id=repair_id, equipment=equipment)
                print(f"Found repair history: {repair.id}")
                print(f"Repair history details: {repair.__dict__}")
            except RepairHistory.DoesNotExist:
                print(f"Repair history not found: {repair_id}")
                return Response({"error": "해당 손상/수리 이력을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
            
            # 요청 데이터 복사 및 equipment 필드 설정
            data = request.data.copy()
            data['equipment'] = equipment.id
            print(f"Modified request data: {data}")
            
            serializer = RepairHistorySerializer(repair, data=data, partial=True)
            
            if serializer.is_valid():
                print(f"Serializer is valid. Validated data: {serializer.validated_data}")
                serializer.save()
                print(f"Repair history updated successfully")
                return Response(serializer.data)
            else:
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error updating repair history: {str(e)}")
            import traceback
            traceback.print_exc()
            logger.error(f"Error updating repair history: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'], url_path='repair_history/(?P<repair_id>[^/.]+)')
    def delete_repair(self, request, pk=None, repair_id=None):
        """
        장비 손상/수리 이력 삭제 API
        """
        try:
            equipment = self.get_object()
            
            try:
                repair = RepairHistory.objects.get(id=repair_id, equipment=equipment)
            except RepairHistory.DoesNotExist:
                return Response({"error": "해당 손상/수리 이력을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
            
            repair.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting repair history: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EquipmentLoanViewSet(viewsets.ModelViewSet):
    queryset = EquipmentLoan.objects.all()
    serializer_class = EquipmentLoanSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        loan = serializer.save()
        loan.equipment.status = 'borrowed'
        loan.equipment.save()

    def perform_update(self, serializer):
        loan = serializer.save()
        if loan.return_date:
            loan.equipment.status = 'available'
            loan.equipment.save()

class EquipmentCheckoutViewSet(viewsets.ModelViewSet):
    queryset = EquipmentCheckout.objects.all().order_by('-checkout_date', 'checkout_location')
    serializer_class = EquipmentCheckoutSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def create(self, request, *args, **kwargs):
        logger.debug(f"Received checkout data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                checkout = serializer.save()
                logger.info(f"Successfully created checkout: {checkout.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error creating checkout: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        logger.warning(f"Invalid checkout data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            logger.info(f"Successfully deleted checkout: {instance.id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting checkout {instance.id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def return_equipment(self, request, pk=None):
        try:
            logger.debug(f"Received return data for checkout {pk}: {request.data}")
            checkout = self.get_object()
            
            if checkout.return_date:
                logger.warning(f"Attempted to return already returned checkout: {pk}")
                return Response({"error": "이미 반입된 장비입니다."}, status=status.HTTP_400_BAD_REQUEST)
            
            return_date = request.data.get('return_date')
            returned_to = request.data.get('returned_to')
            
            # 반납일과 반납자가 없는 경우 현재 날짜와 현재 사용자로 설정
            if not return_date:
                return_date = timezone.now().date().isoformat()
                logger.info(f"No return_date provided, using current date: {return_date}")
            
            if not returned_to:
                returned_to = request.user.username
                logger.info(f"No returned_to provided, using current user: {returned_to}")
            
            try:
                with transaction.atomic():
                    checkout.return_date = return_date
                    checkout.returned_to = returned_to
                    checkout.save()

                    for item in checkout.checkout_equipment.all():
                        item.equipment.set_available()
                        item.equipment.save()

                logger.info(f"Successfully returned equipment for checkout {pk}")
                return Response({"message": "장비가 성공적으로 반입되었습니다."})
            except Exception as e:
                logger.error(f"Error in transaction for returning checkout {pk}: {str(e)}")
                return Response({"error": f"반입 처리 중 오류가 발생했습니다: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Error returning equipment for checkout {pk}: {str(e)}", exc_info=True)
            return Response({"error": f"반입 처리 중 오류가 발생했습니다: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        cache_key = f"dashboard_summary_{request.user.id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)

        today = timezone.now().date()
        
        # 데이터베이스 쿼리 최적화: 필요한 필드만 선택
        upcoming_calibrations = Equipment.objects.filter(
            next_calibration_date__lte=today + timedelta(days=90),
            next_calibration_date__gt=today
        ).only('id', 'name', 'management_number', 'next_calibration_date', 'team').order_by('next_calibration_date')
        
        overdue_calibrations = Equipment.objects.filter(
            next_calibration_date__lt=today
        ).only('id', 'name', 'management_number', 'next_calibration_date', 'team').order_by('next_calibration_date')
        
        borrowed_equipment = EquipmentLoan.objects.filter(return_date__isnull=True).select_related('equipment')
        checked_out_equipment = EquipmentCheckout.objects.filter(return_date__isnull=True).prefetch_related('checkout_equipment', 'checkout_equipment__equipment')
        
        # 더 가벼운 응답을 위한 커스텀 직렬화
        upcoming_data = []
        for equip in upcoming_calibrations:
            upcoming_data.append({
                'id': equip.id,
                'name': equip.name,
                'management_number': equip.management_number,
                'next_calibration_date': equip.next_calibration_date,
                'team': equip.team
            })
            
        overdue_data = []
        for equip in overdue_calibrations:
            overdue_data.append({
                'id': equip.id,
                'name': equip.name,
                'management_number': equip.management_number,
                'next_calibration_date': equip.next_calibration_date,
                'team': equip.team
            })
        
        # 전체 통계 계산
        total_equipment = Equipment.objects.count()
        available_equipment = Equipment.objects.filter(status='available').count()
        checked_out = Equipment.objects.filter(status='checked_out').count()
        borrowed = Equipment.objects.filter(status='borrowed').count()
        due_for_calibration = Equipment.objects.filter(
            next_calibration_date__lte=today + timedelta(days=90),
            next_calibration_date__gt=today
        ).count()
        overdue_calibration = Equipment.objects.filter(
            next_calibration_date__lt=today
        ).count()
        
        # annotate와 values를 활용한 단일 쿼리로 팀별 통계 계산
        team_stats = Equipment.objects.values('team').annotate(
            total=Count('id'),
            available=Count('id', filter=Q(status='available')),
            checked_out=Count('id', filter=Q(status='checked_out')),
            borrowed=Count('id', filter=Q(status='borrowed')),
            calibration_due=Count('id', filter=Q(
                next_calibration_date__lte=today + timedelta(days=90),
                next_calibration_date__gt=today
            )),
            calibration_overdue=Count('id', filter=Q(
                next_calibration_date__lt=today
            ))
        )

        # 팀별 통계 데이터 정리
        teams_data = {}
        for team in team_stats:
            team_name = team['team'] or 'unknown'  # 팀 정보가 없는 경우 'unknown'으로 처리
            teams_data[team_name] = {
                'total': team['total'],
                'available': team['available'],
                'checked_out': team['checked_out'],
                'borrowed': team['borrowed'],
                'calibration_due': team['calibration_due'],
                'calibration_overdue': team['calibration_overdue']
            }

        result_data = {
            'total_equipment': total_equipment,
            'available_equipment': available_equipment,
            'checked_out_equipment': checked_out,
            'borrowed_equipment': borrowed,
            'calibration_due': due_for_calibration,
            'calibration_overdue': overdue_calibration,
            'teams': teams_data
        }

        # 결과 캐싱 (5분)
        cache.set(cache_key, result_data, 60 * 5)
        return Response(result_data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        
        # annotate와 values를 활용한 단일 쿼리로 팀별 통계 계산
        team_stats = Equipment.objects.values('team').annotate(
            total=Count('id'),
            available=Count('id', filter=Q(status='available')),
            checked_out=Count('id', filter=Q(status='checked_out')),
            borrowed=Count('id', filter=Q(status='borrowed')),
            calibration_due=Count('id', filter=Q(
                next_calibration_date__lte=today + timedelta(days=90),
                next_calibration_date__gt=today
            )),
            calibration_overdue=Count('id', filter=Q(
                next_calibration_date__lt=today
            ))
        )

        # 전체 통계 계산
        total_equipment = Equipment.objects.count()
        available_equipment = Equipment.objects.filter(status='available').count()
        checked_out = Equipment.objects.filter(status='checked_out').count()
        borrowed = Equipment.objects.filter(status='borrowed').count()
        due_for_calibration = Equipment.objects.filter(
            next_calibration_date__lte=today + timedelta(days=90),
            next_calibration_date__gt=today
        ).count()
        overdue_calibration = Equipment.objects.filter(
            next_calibration_date__lt=today
        ).count()
        
        # 팀별 통계 데이터 정리
        teams_data = {}
        for team in team_stats:
            team_name = team['team'] or 'unknown'  # 팀 정보가 없는 경우 'unknown'으로 처리
            teams_data[team_name] = {
                'total': team['total'],
                'available': team['available'],
                'checked_out': team['checked_out'],
                'borrowed': team['borrowed'],
                'calibration_due': team['calibration_due'],
                'calibration_overdue': team['calibration_overdue']
            }

        return Response({
            'total_equipment': total_equipment,
            'available_equipment': available_equipment,
            'checked_out': checked_out,
            'borrowed': borrowed,
            'due_for_calibration': due_for_calibration,
            'overdue_calibration': overdue_calibration,
            'teams': teams_data
        })

    @action(detail=False, methods=['get'])
    def activities(self, request):
        # 최근 활동 데이터 가져오기 (대여, 반납, 교정, 유지보수)
        recent_checkouts = EquipmentCheckout.objects.filter(
            return_date__isnull=True
        ).order_by('-checkout_date')[:5]
        
        recent_returns = EquipmentCheckout.objects.filter(
            return_date__isnull=False
        ).order_by('-return_date')[:5]
        
        recent_calibrations = CalibrationHistory.objects.all().order_by('-calibration_date')[:5]
        
        recent_maintenance = MaintenanceHistory.objects.all().order_by('-maintenance_date')[:5]
        
        # 활동 데이터 직렬화
        checkout_data = []
        for checkout in recent_checkouts:
            checkout_data.append({
                'id': checkout.id,
                'type': 'checkout',
                'description': f'Checked out to {checkout.checkout_location}',
                'equipment_name': checkout.checkout_equipment.first().equipment.name if checkout.checkout_equipment.first() else 'Unknown',
                'date': checkout.checkout_date
            })
        
        return_data = []
        for ret in recent_returns:
            return_data.append({
                'id': ret.id,
                'type': 'return',
                'description': f'Returned from {ret.checkout_location}',
                'equipment_name': ret.checkout_equipment.first().equipment.name if ret.checkout_equipment.first() else 'Unknown',
                'date': ret.return_date
            })
        
        calibration_data = []
        for cal in recent_calibrations:
            calibration_data.append({
                'id': cal.id,
                'type': 'calibration',
                'description': f'Calibrated by {cal.performed_by}',
                'equipment_name': cal.equipment.name,
                'date': cal.calibration_date
            })
        
        maintenance_data = []
        for maint in recent_maintenance:
            maintenance_data.append({
                'id': maint.id,
                'type': 'maintenance',
                'description': f'{maint.maintenance_type} maintenance',
                'equipment_name': maint.equipment.name,
                'date': maint.maintenance_date
            })
        
        # 모든 활동 데이터 합치기 및 날짜별 정렬
        all_activities = checkout_data + return_data + calibration_data + maintenance_data
        all_activities.sort(key=lambda x: x['date'], reverse=True)
        
        return Response(all_activities[:10])  # 최대 10개 활동 반환

    @action(detail=False, methods=['get'])
    def calibrations(self, request):
        today = timezone.now().date()
        
        # 다가오는 교정 장비 가져오기
        upcoming_calibrations = Equipment.objects.filter(
            next_calibration_date__lte=today + timedelta(days=90),
            next_calibration_date__gt=today
        ).order_by('next_calibration_date')
        
        calibration_data = []
        for equipment in upcoming_calibrations:
            days_until = (equipment.next_calibration_date - today).days
            calibration_data.append({
                'id': equipment.id,
                'equipment_name': equipment.name,
                'management_number': equipment.management_number,
                'next_calibration_date': equipment.next_calibration_date,
                'days_until': days_until
            })
        
        return Response(calibration_data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        today = timezone.now().date()
        
        # 반납 기한이 지난 장비 가져오기
        overdue_checkouts = EquipmentCheckout.objects.filter(
            return_date__isnull=True,
            expected_return_date__lt=today
        ).order_by('expected_return_date')
        
        overdue_data = []
        for checkout in overdue_checkouts:
            days_overdue = (today - checkout.expected_return_date).days
            equipment_name = checkout.checkout_equipment.first().equipment.name if checkout.checkout_equipment.first() else 'Unknown'
            
            overdue_data.append({
                'id': checkout.id,
                'equipment_name': equipment_name,
                'checkout_location': checkout.checkout_location,
                'expected_return_date': checkout.expected_return_date,
                'days_overdue': days_overdue
            })
        
        return Response(overdue_data)

    @action(detail=False, methods=['post'])
    def send_calibration_reminder(self, request):
        today = timezone.now().date()
        upcoming_calibrations = Equipment.objects.filter(
            next_calibration_date__lte=today + timedelta(days=90),
            next_calibration_date__gt=today
        ).order_by('next_calibration_date')

        overdue_calibrations = Equipment.objects.filter(
            next_calibration_date__lt=today
        ).order_by('next_calibration_date')

        if upcoming_calibrations or overdue_calibrations:
            upcoming_list = "\n".join([f"{eq.name} - {eq.next_calibration_date}" for eq in upcoming_calibrations])
            overdue_list = "\n".join([f"{eq.name} - {eq.next_calibration_date}" for eq in overdue_calibrations])
            
            subject = "장비 교정 알림"
            message = f"90일 이내 교정 예정 장비:\n\n{upcoming_list}\n\n"
            if overdue_calibrations:
                message += f"교정 기한 초과 장비:\n\n{overdue_list}"
            
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = User.objects.filter(role='admin').values_list('email', flat=True)

            try:
                send_mail(subject, message, from_email, recipient_list)
                return Response({"message": "Calibration reminder sent successfully"})
            except Exception as e:
                logger.error(f"Error sending calibration reminder: {str(e)}")
                return Response({"error": "Failed to send calibration reminder"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({"message": "No upcoming or overdue calibrations"})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, is_read=False)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def generate(self, request):
        report_type = request.query_params.get('type', 'all')
        
        if report_type == 'all':
            queryset = Equipment.objects.all()
        elif report_type == 'due_calibration':
            queryset = Equipment.objects.filter(
                next_calibration_date__lte=timezone.now().date() + timedelta(days=30),
                next_calibration_date__gt=timezone.now().date()
            )
        elif report_type == 'overdue':
            queryset = Equipment.objects.filter(
                next_calibration_date__lt=timezone.now().date()
            )
        else:
            return Response({"error": "Invalid report type"}, status=status.HTTP_400_BAD_REQUEST)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="equipment_report_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Name', 'Management Number', 'Asset Number', 'Model', 'Manufacturer', 'Last Calibration', 'Next Calibration', 'Location', 'Status'])

        for equipment in queryset:
            writer.writerow([
                equipment.name,
                equipment.management_number,
                equipment.asset_number,
                equipment.model_name,
                equipment.manufacturer,
                equipment.last_calibration_date,
                equipment.next_calibration_date,
                equipment.location,
                equipment.status
            ])

        return response

