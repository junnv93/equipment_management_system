#equipment/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from datetime import timedelta
from zoneinfo import ZoneInfo
from django.utils.translation import gettext_lazy as _

# 전역 상수로 TEAM_CHOICES 정의
TEAM_CHOICES = [
    ('RF', 'RF팀'),
    ('SAR', 'SAR팀'),
    ('EMC', 'EMC팀'),
    ('AUTO', 'Automotive팀'),
]

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('user', 'Normal User'),
        ('approver', 'Approver'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    team = models.CharField(max_length=10, choices=TEAM_CHOICES, default='RF', verbose_name="소속팀")

    def is_admin(self):
        return self.role == 'admin'

    def is_approver(self):
        return self.role == 'approver'

    def save(self, *args, **kwargs):
        if self.password and not self.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

class Equipment(models.Model):
    STATUS_CHOICES = [
        ('available', '사용 가능'),
        ('borrowed', '대여 중'),
        ('checked_out', '반출 중'),
        ('calibration_soon', '교정 예정'),
        ('calibration_overdue', '교정 기한 초과'),
        ('spare', '여분')
    ]

    MANAGEMENT_METHOD_CHOICES = [
        ('external_calibration', '외부교정'),
        ('self_check', '자체점검'),
        ('not_applicable', '비대상'),
    ]
    
    name = models.CharField(_("장비명"), max_length=200)
    team = models.CharField(max_length=10, choices=TEAM_CHOICES, default='RF', verbose_name="소속팀")
    management_number = models.CharField(max_length=50, unique=True, verbose_name="관리번호")
    asset_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="자산번호")
    model_name = models.CharField(max_length=100, verbose_name="모델명")
    manufacturer = models.CharField(max_length=100, verbose_name="제조사")
    location = models.CharField(max_length=100, verbose_name="위치")
    purchase_year = models.IntegerField(verbose_name="구입년도", null=True, blank=True)
    calibration_cycle = models.IntegerField(verbose_name="교정주기(개월)")
    last_calibration_date = models.DateField(null=True, blank=True, verbose_name="최종교정일")
    next_calibration_date = models.DateField(null=True, blank=True, verbose_name="차기교정일")
    calibration_institution = models.CharField(max_length=200, blank=True, null=True, verbose_name="교정기관")
    serial_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="일련번호")
    specifications = models.TextField(blank=True, null=True, verbose_name="장비사양")
    intermediate_check = models.BooleanField(default=False, verbose_name="중간점검 대상")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', verbose_name="상태")
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_equipment')
    last_updated = models.DateTimeField(auto_now=True, verbose_name="최종 업데이트 일자")
    management_method = models.CharField(
        max_length=100, 
        choices=[
            ('external_calibration', '외부교정'),
            ('self_check', '자체점검'),
            ('not_applicable', '비대상'),
        ],
        default='external_calibration',
        verbose_name="관리방법",
        blank=True
    )
    
    # 추가 필드들
    supplier = models.CharField(max_length=100, blank=True, null=True, verbose_name="공급사")
    supplier_contact = models.CharField(max_length=100, blank=True, null=True, verbose_name="공급사 연락처")
    manufacturer_contact = models.CharField(max_length=100, blank=True, null=True, verbose_name="제조사 연락처")
    software_version = models.CharField(max_length=50, blank=True, null=True, verbose_name="S/W 버전")
    firmware_version = models.CharField(max_length=50, blank=True, null=True, verbose_name="펌웨어 버전")
    manual_location = models.CharField(max_length=200, blank=True, null=True, verbose_name="메뉴얼 보관 위치")
    accessories = models.TextField(blank=True, null=True, verbose_name="부속품 목록")
    key_features = models.TextField(blank=True, null=True, verbose_name="주요 기능")
    primary_technical_manager = models.CharField(max_length=100, blank=True, null=True, verbose_name="기술책임자(정)")
    secondary_technical_manager = models.CharField(max_length=100, blank=True, null=True, verbose_name="기술책임자(부)")
    installation_date = models.DateField(blank=True, null=True, verbose_name="설치 일시")
    specification_compliance = models.BooleanField(default=False, verbose_name="시방 일치")
    needs_calibration = models.BooleanField(default=False, verbose_name="교정 필요")
    
    # 장비 이미지
    image = models.ImageField(upload_to='equipment_images/', blank=True, null=True, verbose_name="장비 이미지")

    # 대여 정보 필드
    borrower = models.IntegerField(blank=True, null=True, verbose_name="대여자 ID")
    borrower_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="대여자 이름")
    borrower_department = models.CharField(max_length=100, blank=True, null=True, verbose_name="대여자 부서")
    borrowed_date = models.DateField(blank=True, null=True, verbose_name="대여일")
    expected_return_date = models.DateField(blank=True, null=True, verbose_name="반납 예정일")

    def __str__(self):
        return "{} ({})".format(self.name, self.management_number)

    def update_status(self):
        korea_tz = ZoneInfo("Asia/Seoul")
        now = timezone.now().astimezone(korea_tz).date()
        
        # 여분 상태는 변경하지 않음
        if self.status == 'spare':
            return
            
        # 비대상이나 자체점검 장비는 대여/반출 상태가 아니면 항상 사용 가능
        if self.management_method in ['self_check', 'not_applicable']:
            if self.status not in ['borrowed', 'checked_out', 'spare']:
                self.status = 'available'
            return

        # 외부교정 장비의 경우만 교정 상태 체크
        if self.management_method == 'external_calibration':
            if self.last_calibration_date and self.calibration_cycle:
                self.next_calibration_date = self.last_calibration_date + relativedelta(months=self.calibration_cycle)

            if self.next_calibration_date:
                days_until_calibration = (self.next_calibration_date - now).days
                if days_until_calibration <= 0:
                    self.status = 'calibration_overdue'
                elif days_until_calibration <= 90:
                    self.status = 'calibration_soon'
                elif self.status not in ['borrowed', 'checked_out', 'spare']:
                    self.status = 'available'
            elif self.status not in ['borrowed', 'checked_out', 'spare']:
                self.status = 'available'

    def save(self, *args, **kwargs):
        # 비대상이나 자체점검 장비의 경우 교정 관련 필드 초기화
        if self.management_method in ['self_check', 'not_applicable']:
            self.last_calibration_date = None
            self.next_calibration_date = None
            self.calibration_cycle = 0  # 교정 주기를 0으로 설정
            self.calibration_institution = None  # 교정 기관 정보 초기화
            if self.status not in ['borrowed', 'checked_out', 'spare']:
                self.status = 'available'  # 대여/반출 중이나 여분이 아니면 사용 가능으로 설정
        
        self.update_status()
        super().save(*args, **kwargs)

    def set_available(self):
        self.status = 'available'
        self.save()

    def set_borrowed(self):
        self.status = 'borrowed'
        self.save()

    def set_checked_out(self):
        self.status = 'checked_out'
        self.save()

def get_default_return_date():
    korea_tz = ZoneInfo("Asia/Seoul")
    return timezone.now().astimezone(korea_tz).date() + timedelta(days=7)

class EquipmentLoan(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='loans')
    borrower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='equipment_loans')
    borrower_name = models.CharField(max_length=100, default='Unknown')
    borrower_department = models.CharField(max_length=100, default='Unknown')
    loan_date = models.DateTimeField(auto_now_add=True)
    borrowed_date = models.DateField(null=True, blank=True, verbose_name="대여일")
    expected_return_date = models.DateField(default=get_default_return_date)
    return_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return "{} - {}".format(self.equipment.name, self.borrower_name)

class EquipmentCheckout(models.Model):
    checkout_location = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    reason = models.TextField()
    checkout_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    person_in_charge = models.CharField(max_length=100)
    returned_to = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return "Checkout to {} on {}".format(self.checkout_location, self.checkout_date)

    def return_equipment(self, return_date, returned_to):
        if self.return_date:
            raise ValueError("이미 반입된 장비입니다.")
        
        self.return_date = return_date
        self.returned_to = returned_to
        self.save()

        for item in self.checkout_equipment.all():
            item.equipment.set_available()
            item.equipment.save()

    def add_equipment(self, equipment, quantity=1):
        checkout_equipment, created = CheckoutEquipment.objects.get_or_create(
            checkout=self,
            equipment=equipment,
            defaults={
                'quantity': quantity,
                'management_number': equipment.management_number,
                'model': equipment.model_name,
                'serial_number': equipment.serial_number
            }
        )
        if not created:
            checkout_equipment.quantity += quantity
            checkout_equipment.save()
        equipment.set_checked_out()

class CheckoutEquipment(models.Model):
    checkout = models.ForeignKey(EquipmentCheckout, on_delete=models.CASCADE, related_name='checkout_equipment')
    equipment = models.ForeignKey('Equipment', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    management_number = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=100, null=True, blank=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return "{} - {}".format(self.equipment.name, self.quantity)

    def save(self, *args, **kwargs):
        if not self.management_number:
            self.management_number = self.equipment.management_number
        if not self.model:
            self.model = self.equipment.model_name
        if not self.serial_number:
            self.serial_number = self.equipment.serial_number
        super().save(*args, **kwargs)
        if not self.checkout.return_date:
            self.equipment.set_checked_out()

class EquipmentLocationHistory(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='location_history', verbose_name='장비')
    location = models.CharField(max_length=100, verbose_name='위치')
    change_date = models.DateField(default=timezone.now, verbose_name='변동일시')
    notes = models.TextField(blank=True, null=True, verbose_name='비고')
    
    def __str__(self):
        return f"{self.equipment.name} - {self.location} ({self.change_date.strftime('%Y-%m-%d')})"
    
    class Meta:
        verbose_name = '위치 변동 이력'
        verbose_name_plural = '위치 변동 이력'
        ordering = ['-change_date']

class CalibrationHistory(models.Model):
    equipment = models.ForeignKey(
        Equipment, 
        on_delete=models.CASCADE, 
        related_name='calibration_history'
    )
    calibration_date = models.DateField()
    next_calibration_date = models.DateField()
    institution = models.CharField(max_length=255)
    result = models.CharField(max_length=255)

    class Meta:
        ordering = ['-calibration_date']

    def __str__(self):
        return f"{self.equipment.name} - {self.calibration_date}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class MaintenanceHistory(models.Model):
    equipment = models.ForeignKey(
        Equipment, 
        on_delete=models.CASCADE, 
        related_name='maintenance_history',
        verbose_name='장비'
    )
    maintenance_date = models.DateField(verbose_name='유지보수 일시')
    description = models.TextField(verbose_name='주요 내용')
    performed_by = models.CharField(max_length=100, verbose_name='수행자', blank=True, null=True)
    
    class Meta:
        ordering = ['-maintenance_date']
        verbose_name = '유지보수 이력'
        verbose_name_plural = '유지보수 이력'

    def __str__(self):
        return f"{self.equipment.name} - {self.maintenance_date}"

class RepairHistory(models.Model):
    ISSUE_TYPE_CHOICES = [
        ('damage', '손상'),
        ('malfunction', '오작동'),
        ('modification', '변경'),
        ('repair', '수리')
    ]
    
    equipment = models.ForeignKey(
        Equipment, 
        on_delete=models.CASCADE, 
        related_name='repair_history',
        verbose_name='장비'
    )
    issue_date = models.DateField(verbose_name='발생 일시')
    issue_type = models.CharField(
        max_length=20, 
        choices=ISSUE_TYPE_CHOICES, 
        default='repair',
        verbose_name='유형'
    )
    description = models.TextField(verbose_name='주요 내용')
    resolved = models.BooleanField(default=False, verbose_name='해결 여부')
    resolved_date = models.DateField(null=True, blank=True, verbose_name='해결 일시')
    
    class Meta:
        ordering = ['-issue_date']
        verbose_name = '손상/수리 이력'
        verbose_name_plural = '손상/수리 이력'

    def __str__(self):
        return f"{self.equipment.name} - {self.get_issue_type_display()} ({self.issue_date})"
