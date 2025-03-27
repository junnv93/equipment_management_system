#equipment/serializers.py
from rest_framework import serializers
from .models import Equipment, EquipmentLoan, User, CalibrationHistory, Notification, EquipmentCheckout, CheckoutEquipment, EquipmentLocationHistory, MaintenanceHistory, RepairHistory
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'team', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class EquipmentSerializer(serializers.ModelSerializer):
    next_calibration_date = serializers.DateField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    management_method_display = serializers.CharField(source='get_management_method_display', read_only=True)
    team_display = serializers.CharField(source='get_team_display', read_only=True)
    
    # calibration_institution 필드를 institution으로 매핑
    institution = serializers.CharField(source='calibration_institution', required=False, allow_null=True)
    # status 필드를 명시적으로 정의
    status = serializers.ChoiceField(choices=Equipment.STATUS_CHOICES, required=False)

    class Meta:
        model = Equipment
        fields = ['id', 'management_number', 'asset_number', 'name', 
                 'model_name', 'manufacturer', 'location', 'management_method',
                 'management_method_display', 'purchase_year', 
                 'last_calibration_date', 'calibration_cycle',
                 'calibration_institution', 'institution',  # 두 필드 모두 포함
                 'serial_number', 'intermediate_check', 'status', 'status_display',
                 'specifications', 'next_calibration_date', 'team', 'team_display',
                 # 추가 필드들
                 'supplier', 'supplier_contact', 'manufacturer_contact',
                 'software_version', 'firmware_version', 'manual_location', 
                 'accessories', 'key_features', 'primary_technical_manager',
                 'secondary_technical_manager', 'installation_date',
                 'specification_compliance', 'needs_calibration', 'image']

    def to_internal_value(self, data):
        # 상태값이 유효하지 않은 경우 'available'로 변경
        if 'status' in data and data['status'] not in dict(Equipment.STATUS_CHOICES):
            data = data.copy()  # QueryDict는 불변이므로 복사
            data['status'] = 'available'
            logger.warning(f"Invalid status value received. Changed to: available")
        return super().to_internal_value(data)

    def validate(self, data):
        logger.debug(f"Validating equipment data: {data}")
        
        # 관리방법이 '비대상'인 경우 교정 관련 필드 처리
        if data.get('management_method') == 'not_applicable':
            data['last_calibration_date'] = None
            data['next_calibration_date'] = None
            data['calibration_cycle'] = 0
            data['calibration_institution'] = None
            # 상태를 사용 가능으로 설정 (대여/반출 중이 아닌 경우)
            if not (self.instance and self.instance.status in ['borrowed', 'checked_out']):
                data['status'] = 'available'
        # 관리방법이 '비대상'이 아닌 경우 교정주기 검증
        elif 'calibration_cycle' in data and data['calibration_cycle'] <= 0:
            raise serializers.ValidationError({"calibration_cycle": "교정 주기는 양수여야 합니다."})
            
        if 'name' in data and not data['name']:
            raise serializers.ValidationError({"name": "장비명은 필수입니다."})
        if 'management_number' in data and not data['management_number']:
            raise serializers.ValidationError({"management_number": "관리번호는 필수입니다."})
            
        # 상태값 검증
        if 'status' in data:
            valid_statuses = dict(Equipment.STATUS_CHOICES).keys()
            current_status = data['status']
            logger.debug(f"Validating status: {current_status}, Valid statuses: {valid_statuses}")
            
            if current_status not in valid_statuses:
                logger.warning(f"Invalid status value received: {current_status}")
                # 대여/반출 중인 경우 해당 상태 유지, 그 외에는 사용 가능으로 설정
                if self.instance and self.instance.status in ['borrowed', 'checked_out']:
                    data['status'] = self.instance.status
                else:
                    data['status'] = 'available'
                logger.info(f"Status changed to: {data['status']}")
        
        # 관리방법에 따른 교정 관련 필드 처리
        if data.get('management_method') in ['self_check', 'not_applicable']:
            data['last_calibration_date'] = None
            data['next_calibration_date'] = None
            data['calibration_institution'] = None
            data['calibration_cycle'] = 0
            
        logger.debug(f"Validated data: {data}")
        return data

class EquipmentLoanSerializer(serializers.ModelSerializer):
    borrower = serializers.PrimaryKeyRelatedField(read_only=True)
    borrower_name = serializers.CharField(max_length=100)
    borrower_department = serializers.CharField(max_length=100)
    equipment_name = serializers.ReadOnlyField(source='equipment.name')
    equipment_serial = serializers.ReadOnlyField(source='equipment.serial_number')
    management_number = serializers.ReadOnlyField(source='equipment.management_number')
    borrowed_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = EquipmentLoan
        fields = ['id', 'equipment', 'borrower', 'borrower_name', 'borrower_department', 'loan_date', 'borrowed_date', 'expected_return_date', 'return_date', 'notes', 'management_number', 'equipment_name', 'equipment_serial']

    def create(self, validated_data):
        validated_data['borrower'] = self.context['request'].user
        return super().create(validated_data)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # borrowed_date가 없는 경우 loan_date에서 날짜 부분을 추출하여 사용
        if representation.get('borrowed_date') is None and representation.get('loan_date'):
            loan_date = instance.loan_date
            representation['borrowed_date'] = loan_date.date().isoformat()
        return representation
        
    def validate(self, data):
        if data.get('return_date') and data['return_date'] < data.get('loan_date', data.get('borrowed_date')):
            raise serializers.ValidationError("반납일은 대여일보다 빠를 수 없습니다.")
        available_statuses = ['available', 'calibration_soon']
        if data['equipment'].status not in available_statuses:
            raise serializers.ValidationError("이 장비는 현재 대여 가능한 상태가 아닙니다.")
        return data

class CheckoutEquipmentSerializer(serializers.ModelSerializer):
    equipment = serializers.PrimaryKeyRelatedField(queryset=Equipment.objects.all())
    model_name = serializers.CharField(read_only=True)
    management_number = serializers.CharField(read_only=True)
    equipment_name = serializers.CharField(read_only=True)

    class Meta:
        model = CheckoutEquipment
        fields = ['equipment', 'model_name', 'management_number', 'equipment_name', 'serial_number', 'quantity']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        equipment = instance.equipment
        representation['model_name'] = equipment.model_name
        representation['management_number'] = equipment.management_number
        representation['equipment_name'] = equipment.name
        return representation

class EquipmentCheckoutSerializer(serializers.ModelSerializer):
    checkout_equipment = CheckoutEquipmentSerializer(many=True)

    class Meta:
        model = EquipmentCheckout
        fields = ['id', 'checkout_location', 'phone_number', 'address', 'reason', 'checkout_date', 'return_date', 'person_in_charge', 'returned_to', 'checkout_equipment']

    @transaction.atomic
    def create(self, validated_data):
        logger.info(f"Creating new checkout: {validated_data}")
        checkout_equipment_data = validated_data.pop('checkout_equipment')
        checkout = EquipmentCheckout.objects.create(**validated_data)
        
        equipment_counts = {}
        for item_data in checkout_equipment_data:
            equipment = item_data['equipment']
            quantity = item_data.get('quantity', 1)
            equipment_counts[equipment.id] = equipment_counts.get(equipment.id, 0) + quantity

        for equipment_id, total_quantity in equipment_counts.items():
            equipment = Equipment.objects.get(id=equipment_id)
            if equipment.status != 'available':
                logger.error(f"Equipment not available: {equipment}")
                raise serializers.ValidationError(f"{equipment.name}은(는) 현재 대여 가능한 상태가 아닙니다.")
            
            CheckoutEquipment.objects.create(
                checkout=checkout,
                equipment=equipment,
                model=equipment.model_name,
                management_number=equipment.management_number,
                serial_number=equipment.serial_number,
                quantity=total_quantity
            )
            equipment.set_checked_out()
            equipment.save()
        
        logger.info(f"Checkout created successfully: {checkout}")
        return checkout

    @transaction.atomic
    def update(self, instance, validated_data):
        logger.info(f"Updating checkout: {instance}")
        checkout_equipment_data = validated_data.pop('checkout_equipment', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if checkout_equipment_data is not None:
            # 기존 장비 ID 목록
            existing_equipment_ids = set(instance.checkout_equipment.values_list('equipment_id', flat=True))
            # 새 장비 ID 목록
            new_equipment_ids = set(item['equipment'].id for item in checkout_equipment_data)
            
            logger.info(f"Existing equipment IDs: {existing_equipment_ids}")
            logger.info(f"New equipment IDs: {new_equipment_ids}")
            
            # 삭제된 장비 처리 (기존에 있었지만 새 목록에 없는 장비)
            removed_equipment_ids = existing_equipment_ids - new_equipment_ids
            if removed_equipment_ids:
                logger.info(f"Removing equipment IDs: {removed_equipment_ids}")
                for equipment_id in removed_equipment_ids:
                    checkout_equipment = instance.checkout_equipment.get(equipment_id=equipment_id)
                    equipment = checkout_equipment.equipment
                    checkout_equipment.delete()
                    if not instance.return_date:
                        equipment.set_available()
                        equipment.save()
            
            # 새로 추가된 장비 처리 (새 목록에 있지만 기존에 없던 장비)
            added_equipment_ids = new_equipment_ids - existing_equipment_ids
            if added_equipment_ids:
                logger.info(f"Adding equipment IDs: {added_equipment_ids}")
                for item_data in checkout_equipment_data:
                    equipment = item_data['equipment']
                    if equipment.id in added_equipment_ids:
                        # 장비가 대여 가능한 상태인지 확인
                        available_statuses = ['available', 'calibration_soon']
                        if equipment.status not in available_statuses:
                            logger.error(f"Equipment not available: {equipment}")
                            raise serializers.ValidationError(f"{equipment.name}은(는) 현재 대여 가능한 상태가 아닙니다.")
                        
                        # 새 장비 추가
                        CheckoutEquipment.objects.create(
                            checkout=instance,
                            equipment=equipment,
                            model=equipment.model_name,
                            management_number=equipment.management_number,
                            serial_number=equipment.serial_number,
                            quantity=item_data.get('quantity', 1)
                        )
                        
                        # 반출 중이 아닌 경우에만 상태 변경
                        if equipment.status != 'checked_out' and not instance.return_date:
                            equipment.set_checked_out()
                            equipment.save()
            
            # 유지된 장비 처리 (기존에도 있고 새 목록에도 있는 장비)
            maintained_equipment_ids = existing_equipment_ids.intersection(new_equipment_ids)
            if maintained_equipment_ids:
                logger.info(f"Maintaining equipment IDs: {maintained_equipment_ids}")
                # 수량 업데이트 등 필요한 경우 여기서 처리
                # 현재는 별도 처리 없음

        logger.info(f"Checkout updated successfully: {instance}")
        return instance

    def validate(self, attrs):
        logger.debug(f"Validating checkout data: {attrs}")
        
        # 기존 인스턴스가 있는지 확인 (수정 모드인지 확인)
        is_update = self.instance is not None
        
        # 수정 모드에서 기존 장비 ID 목록 가져오기
        existing_equipment_ids = set()
        if is_update and hasattr(self.instance, 'checkout_equipment'):
            existing_equipment_ids = set(self.instance.checkout_equipment.values_list('equipment_id', flat=True))
            logger.debug(f"Existing equipment IDs: {existing_equipment_ids}")
        
        for item in attrs.get('checkout_equipment', []):
            equipment = item['equipment']
            equipment_id = equipment.id
            
            # 수정 모드에서 기존 장비는 상태 검증 건너뛰기
            if is_update and equipment_id in existing_equipment_ids:
                logger.debug(f"Skipping validation for existing equipment: {equipment}")
                continue
                
            # 새로 추가되는 장비만 상태 검증
            available_statuses = ['available', 'calibration_soon']
            if equipment.status not in available_statuses:
                logger.error(f"Equipment not available: {equipment}")
                raise serializers.ValidationError(f"{equipment.name}은(는) 현재 대여 가능한 상태가 아닙니다.")
        
        return attrs

class CalibrationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CalibrationHistory
        fields = ['id', 'calibration_date', 'next_calibration_date', 
                 'institution', 'result']

    def create(self, validated_data):
        if 'institution' in validated_data:
            validated_data['calibration_institution'] = validated_data.pop('institution')
        
        equipment = self.context.get('equipment')
        if not equipment:
            raise serializers.ValidationError("Equipment is required")
            
        return CalibrationHistory.objects.create(equipment=equipment, **validated_data)

class EquipmentLocationHistorySerializer(serializers.ModelSerializer):
    change_date = serializers.DateField(format='%Y-%m-%d')
    
    class Meta:
        model = EquipmentLocationHistory
        fields = ['id', 'equipment', 'location', 'change_date', 'notes']

class MaintenanceHistorySerializer(serializers.ModelSerializer):
    maintenance_date = serializers.DateField(format='%Y-%m-%d')
    
    class Meta:
        model = MaintenanceHistory
        fields = ['id', 'equipment', 'maintenance_date', 'description', 'performed_by']

class RepairHistorySerializer(serializers.ModelSerializer):
    issue_date = serializers.DateField(format='%Y-%m-%d')
    resolved_date = serializers.DateField(format='%Y-%m-%d', required=False, allow_null=True)
    issue_type_display = serializers.CharField(source='get_issue_type_display', read_only=True)
    
    class Meta:
        model = RepairHistory
        fields = ['id', 'equipment', 'issue_date', 'issue_type', 'issue_type_display', 'description', 'resolved', 'resolved_date']

    def validate(self, data):
        print("Validating repair data:", data)
        
        # 필수 필드 검증
        if 'issue_date' not in data:
            raise serializers.ValidationError({"issue_date": "발생 일시는 필수 입력 항목입니다."})
        
        if 'description' not in data or not data['description']:
            raise serializers.ValidationError({"description": "주요 내용은 필수 입력 항목입니다."})
        
        # resolved_date가 빈 문자열인 경우 None으로 변환
        if 'resolved_date' in data and (data['resolved_date'] == '' or data['resolved_date'] == ''):
            print("Converting empty resolved_date to None")
            data['resolved_date'] = None
        
        # 해결 여부가 True인데 해결 일시가 없는 경우
        if data.get('resolved') and not data.get('resolved_date'):
            print("Resolved is True but resolved_date is missing")
            raise serializers.ValidationError({"resolved_date": "해결 여부가 체크된 경우 해결 일시는 필수 입력 항목입니다."})
        
        # 해결 여부가 False인 경우 해결 일시를 None으로 설정
        if 'resolved' in data and not data.get('resolved'):
            print("Resolved is False, setting resolved_date to None")
            data['resolved_date'] = None
        
        print("Validated data:", data)
        return data

class EquipmentDetailSerializer(serializers.ModelSerializer):
    supplier = serializers.CharField(required=False, allow_blank=True)
    supplier_contact = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, default='available')
    location_history = EquipmentLocationHistorySerializer(many=True, read_only=True)
    calibration_history = CalibrationHistorySerializer(many=True, read_only=True)
    maintenance_history = MaintenanceHistorySerializer(many=True, read_only=True)
    repair_history = RepairHistorySerializer(many=True, read_only=True)
    loans = EquipmentLoanSerializer(many=True, read_only=True)
    
    class Meta:
        model = Equipment
        fields = '__all__'
        
    def to_representation(self, instance):
        """대여 정보를 일관되게 제공하기 위한 추가 로직"""
        representation = super().to_representation(instance)
        
        # 장비가 대여 중인 경우, 대여 정보 확인
        if representation.get('status') == 'borrowed':
            # 장비에 직접 저장된 대여 정보가 있는지 확인
            has_borrow_info = any([
                representation.get('borrower') is not None,
                representation.get('borrower_name') is not None,
                representation.get('borrowed_date') is not None
            ])
            
            # 직접 저장된 정보가 없고 대여 기록이 있는 경우
            if not has_borrow_info and representation.get('loans'):
                active_loans = [
                    loan for loan in representation.get('loans', [])
                    if loan.get('return_date') is None
                ]
                
                if active_loans:
                    # 가장 최근 대여 정보 가져오기
                    latest_loan = sorted(
                        active_loans,
                        key=lambda x: x.get('loan_date', ''),
                        reverse=True
                    )[0]
                    
                    # 대여 정보 복사
                    representation['borrower'] = latest_loan.get('borrower')
                    representation['borrower_name'] = latest_loan.get('borrower_name')
                    representation['borrower_department'] = latest_loan.get('borrower_department')
                    representation['borrowed_date'] = latest_loan.get('borrowed_date')
                    representation['expected_return_date'] = latest_loan.get('expected_return_date')
        
        return representation

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
