# equipment/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Equipment, EquipmentLoan, EquipmentCheckout, CalibrationHistory, EquipmentLocationHistory, Notification, CheckoutEquipment, MaintenanceHistory, RepairHistory
from django.contrib.auth.hashers import make_password
from django.utils.html import format_html

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'team', 'is_staff', 'is_active')
    list_filter = ('role', 'team', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'team')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role', 'team')}),
    )

    def save_model(self, request, obj, form, change):
        if obj.password and not obj.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)

class CalibrationHistoryInline(admin.TabularInline):
    model = CalibrationHistory
    extra = 0

class MaintenanceHistoryInline(admin.TabularInline):
    model = MaintenanceHistory
    extra = 0
    
class RepairHistoryInline(admin.TabularInline):
    model = RepairHistory
    extra = 0

class EquipmentAdmin(admin.ModelAdmin):
    inlines = [CalibrationHistoryInline, MaintenanceHistoryInline, RepairHistoryInline]
    list_display = (
        'management_number',  # 관리번호
        'name',               # 장비명
        'team',               # 소속팀
        'last_calibration_date_formatted',  # 최종교정일
        'next_calibration_date_formatted',  # 차기교정일
        'calibration_cycle_display',  # 교정주기
        'calibration_institution',  # 교정기관
        'manufacturer',       # 제조사
        'management_method_display',  # 관리방법
        'location',           # 위치
        'status'              # 상태
    )
    
    list_filter = (
        'team',               # 소속팀
        'management_method',  # 관리방법
        'calibration_institution',  # 교정기관
        'manufacturer',       # 제조사
        'status',             # 상태
        'intermediate_check', # 중간점검 대상
        'location',           # 위치
    )
    
    search_fields = (
        'management_number',
        'name',
        'manufacturer',
        'calibration_institution',
        'model_name',
        'serial_number',
        'location',
    )
    
    ordering = ('management_number',)
    
    list_per_page = 50
    
    date_hierarchy = 'next_calibration_date'
    
    def management_method_display(self, obj):
        methods = {
            'external_calibration': '외부교정',
            'self_check': '자체점검',
            'not_applicable': '비대상',
        }
        method = methods.get(obj.management_method, obj.management_method)
        
        colors = {
            'external_calibration': 'blue',
            'self_check': 'green',
            'not_applicable': 'gray',
        }
        color = colors.get(obj.management_method, 'black')
        
        return format_html('<span style="color: {};">{}</span>', color, method)
    management_method_display.short_description = '관리방법'
    
    def last_calibration_date_formatted(self, obj):
        if obj.last_calibration_date:
            return obj.last_calibration_date.strftime('%Y-%m-%d')
        return 'N/A'
    last_calibration_date_formatted.short_description = '최종교정일'
    
    def next_calibration_date_formatted(self, obj):
        if obj.next_calibration_date:
            from datetime import date
            today = date.today()
            days_left = (obj.next_calibration_date - today).days
            
            if days_left < 0:
                return format_html('<span style="color: red;">{}</span>', 
                                  obj.next_calibration_date.strftime('%Y-%m-%d'))
            elif days_left <= 30:
                return format_html('<span style="color: orange;">{}</span>', 
                                  obj.next_calibration_date.strftime('%Y-%m-%d'))
            else:
                return obj.next_calibration_date.strftime('%Y-%m-%d')
        return 'N/A'
    next_calibration_date_formatted.short_description = '차기교정일'
    
    def calibration_cycle_display(self, obj):
        if obj.calibration_cycle:
            return f"{obj.calibration_cycle}개월"
        return 'N/A'
    calibration_cycle_display.short_description = '교정주기'
    
    readonly_fields = (
        'next_calibration_date',
        'status',
    )
    
    fieldsets = (
        ('기본 정보', {
            'fields': (
                'management_number', 'name', 'team', 'model_name', 'manufacturer', 'serial_number',
                'asset_number', 'purchase_year', 'location', 'installation_date',
                'supplier', 'supplier_contact', 'manufacturer_contact'
            )
        }),
        ('교정/관리 정보', {
            'fields': (
                'management_method', 'calibration_cycle', 'last_calibration_date', 
                'next_calibration_date', 'calibration_institution', 'intermediate_check',
                'specification_compliance', 'needs_calibration'
            ),
            'description': '차기교정일은 최종교정일과 교정 주기에 따라 자동으로 계산됩니다'
        }),
        ('기술 정보', {
            'fields': (
                'specifications', 'software_version', 'firmware_version', 
                'manual_location', 'accessories', 'key_features'
            )
        }),
        ('상태 정보', {
            'fields': (
                'status',
            ),
            'description': '상태는 장비의 교정일, 대여 상태 등에 따라 자동으로 계산됩니다'
        }),
        ('운영/관리 정보', {
            'fields': (
                'primary_technical_manager', 'secondary_technical_manager'
            )
        }),
        ('추가 정보', {
            'fields': ('image',)
        }),
    )

@admin.register(EquipmentLoan)
class EquipmentLoanAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'borrower', 'loan_date', 'expected_return_date', 'return_date')
    list_filter = ('loan_date', 'return_date')
    search_fields = ('equipment__name', 'borrower__username')
    ordering = ('-loan_date',)

@admin.register(EquipmentCheckout)
class EquipmentCheckoutAdmin(admin.ModelAdmin):
    list_display = ('checkout_location', 'checkout_date', 'return_date', 'person_in_charge')
    list_filter = ('checkout_date', 'return_date')
    search_fields = ('checkout_location', 'person_in_charge')

@admin.register(MaintenanceHistory)
class MaintenanceHistoryAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'maintenance_date', 'description', 'performed_by')
    list_filter = ('maintenance_date', 'equipment')
    search_fields = ('equipment__name', 'equipment__management_number', 'description', 'performed_by')
    date_hierarchy = 'maintenance_date'

@admin.register(RepairHistory)
class RepairHistoryAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'issue_date', 'issue_type', 'description', 'resolved', 'resolved_date')
    list_filter = ('issue_date', 'issue_type', 'resolved', 'equipment')
    search_fields = ('equipment__name', 'equipment__management_number', 'description')
    date_hierarchy = 'issue_date'

admin.site.register(User, CustomUserAdmin)
admin.site.register(Equipment, EquipmentAdmin)
admin.site.register(CalibrationHistory)
admin.site.register(EquipmentLocationHistory)
admin.site.register(Notification)