(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  typeof document === 'object' ? document.currentScript : undefined,
  '[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'ACCESSORIES_STATUS_LABELS',
      () => ACCESSORIES_STATUS_LABELS,
      'ACCESSORIES_STATUS_VALUES',
      () => ACCESSORIES_STATUS_VALUES,
      'APPROVAL_ACTION_VALUES',
      () => APPROVAL_ACTION_VALUES,
      'AUDIT_ACTION_VALUES',
      () => AUDIT_ACTION_VALUES,
      'AUDIT_ENTITY_TYPE_VALUES',
      () => AUDIT_ENTITY_TYPE_VALUES,
      'AccessoriesStatusEnum',
      () => AccessoriesStatusEnum,
      'AccessoriesStatusValues',
      () => AccessoriesStatusValues,
      'ApprovalActionEnum',
      () => ApprovalActionEnum,
      'AuditActionEnum',
      () => AuditActionEnum,
      'AuditEntityTypeEnum',
      () => AuditEntityTypeEnum,
      'CALIBRATION_APPROVAL_STATUS_LABELS',
      () => CALIBRATION_APPROVAL_STATUS_LABELS,
      'CALIBRATION_APPROVAL_STATUS_VALUES',
      () => CALIBRATION_APPROVAL_STATUS_VALUES,
      'CALIBRATION_FACTOR_APPROVAL_STATUS_LABELS',
      () => CALIBRATION_FACTOR_APPROVAL_STATUS_LABELS,
      'CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES',
      () => CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES,
      'CALIBRATION_FACTOR_TYPE_LABELS',
      () => CALIBRATION_FACTOR_TYPE_LABELS,
      'CALIBRATION_FACTOR_TYPE_VALUES',
      () => CALIBRATION_FACTOR_TYPE_VALUES,
      'CALIBRATION_METHOD_LABELS',
      () => CALIBRATION_METHOD_LABELS,
      'CALIBRATION_METHOD_VALUES',
      () => CALIBRATION_METHOD_VALUES,
      'CALIBRATION_PLAN_STATUS_LABELS',
      () => CALIBRATION_PLAN_STATUS_LABELS,
      'CALIBRATION_PLAN_STATUS_VALUES',
      () => CALIBRATION_PLAN_STATUS_VALUES,
      'CALIBRATION_REGISTERED_BY_ROLE_VALUES',
      () => CALIBRATION_REGISTERED_BY_ROLE_VALUES,
      'CALIBRATION_REQUIRED_VALUES',
      () => CALIBRATION_REQUIRED_VALUES,
      'CALIBRATION_RESULT_LABELS',
      () => CALIBRATION_RESULT_LABELS,
      'CALIBRATION_RESULT_VALUES',
      () => CALIBRATION_RESULT_VALUES,
      'CHECKOUT_DIRECTION_VALUES',
      () => CHECKOUT_DIRECTION_VALUES,
      'CHECKOUT_PURPOSE_LABELS',
      () => CHECKOUT_PURPOSE_LABELS,
      'CHECKOUT_PURPOSE_VALUES',
      () => CHECKOUT_PURPOSE_VALUES,
      'CHECKOUT_STATUS_FILTER_OPTIONS',
      () => CHECKOUT_STATUS_FILTER_OPTIONS,
      'CHECKOUT_STATUS_GROUPS',
      () => CHECKOUT_STATUS_GROUPS,
      'CHECKOUT_STATUS_LABELS',
      () => CHECKOUT_STATUS_LABELS,
      'CHECKOUT_STATUS_VALUES',
      () => CHECKOUT_STATUS_VALUES,
      'CHECKOUT_TYPE_VALUES',
      () => CHECKOUT_TYPE_VALUES,
      'CLASSIFICATION_LABELS',
      () => CLASSIFICATION_LABELS,
      'CLASSIFICATION_TO_CODE',
      () => CLASSIFICATION_TO_CODE,
      'CODE_TO_CLASSIFICATION',
      () => CODE_TO_CLASSIFICATION,
      'CODE_TO_SITE',
      () => CODE_TO_SITE,
      'CONDITION_CHECK_STEP_LABELS',
      () => CONDITION_CHECK_STEP_LABELS,
      'CONDITION_CHECK_STEP_VALUES',
      () => CONDITION_CHECK_STEP_VALUES,
      'CONDITION_STATUS_LABELS',
      () => CONDITION_STATUS_LABELS,
      'CONDITION_STATUS_VALUES',
      () => CONDITION_STATUS_VALUES,
      'CalibrationApprovalStatusEnum',
      () => CalibrationApprovalStatusEnum,
      'CalibrationApprovalStatusValues',
      () => CalibrationApprovalStatusValues,
      'CalibrationFactorApprovalStatusEnum',
      () => CalibrationFactorApprovalStatusEnum,
      'CalibrationFactorApprovalStatusValues',
      () => CalibrationFactorApprovalStatusValues,
      'CalibrationFactorTypeEnum',
      () => CalibrationFactorTypeEnum,
      'CalibrationFactorTypeValues',
      () => CalibrationFactorTypeValues,
      'CalibrationMethodEnum',
      () => CalibrationMethodEnum,
      'CalibrationPlanStatusEnum',
      () => CalibrationPlanStatusEnum,
      'CalibrationPlanStatusValues',
      () => CalibrationPlanStatusValues,
      'CalibrationRegisteredByRoleEnum',
      () => CalibrationRegisteredByRoleEnum,
      'CalibrationRequiredEnum',
      () => CalibrationRequiredEnum,
      'CalibrationResultEnum',
      () => CalibrationResultEnum,
      'CheckoutDirectionEnum',
      () => CheckoutDirectionEnum,
      'CheckoutPurposeEnum',
      () => CheckoutPurposeEnum,
      'CheckoutPurposeValues',
      () => CheckoutPurposeValues,
      'CheckoutStatusEnum',
      () => CheckoutStatusEnum,
      'CheckoutStatusValues',
      () => CheckoutStatusValues,
      'CheckoutTypeEnum',
      () => CheckoutTypeEnum,
      'ClassificationCodeEnum',
      () => ClassificationCodeEnum,
      'ClassificationEnum',
      () => ClassificationEnum,
      'ConditionCheckStepEnum',
      () => ConditionCheckStepEnum,
      'ConditionCheckStepValues',
      () => ConditionCheckStepValues,
      'ConditionStatusEnum',
      () => ConditionStatusEnum,
      'ConditionStatusValues',
      () => ConditionStatusValues,
      'DISPOSAL_REASON_LABELS',
      () => DISPOSAL_REASON_LABELS,
      'DISPOSAL_REASON_VALUES',
      () => DISPOSAL_REASON_VALUES,
      'DISPOSAL_REVIEW_STATUS_LABELS',
      () => DISPOSAL_REVIEW_STATUS_LABELS,
      'DISPOSAL_REVIEW_STATUS_VALUES',
      () => DISPOSAL_REVIEW_STATUS_VALUES,
      'DisposalReasonEnum',
      () => DisposalReasonEnum,
      'DisposalReviewStatusEnum',
      () => DisposalReviewStatusEnum,
      'DisposalReviewStatusValues',
      () => DisposalReviewStatusValues,
      'EQUIPMENT_IMPORT_SOURCE_LABELS',
      () => EQUIPMENT_IMPORT_SOURCE_LABELS,
      'EQUIPMENT_IMPORT_SOURCE_VALUES',
      () => EQUIPMENT_IMPORT_SOURCE_VALUES,
      'EQUIPMENT_IMPORT_STATUS_LABELS',
      () => EQUIPMENT_IMPORT_STATUS_LABELS,
      'EQUIPMENT_IMPORT_STATUS_VALUES',
      () => EQUIPMENT_IMPORT_STATUS_VALUES,
      'EQUIPMENT_STATUS_FILTER_OPTIONS',
      () => EQUIPMENT_STATUS_FILTER_OPTIONS,
      'EQUIPMENT_STATUS_LABELS',
      () => EQUIPMENT_STATUS_LABELS,
      'EQUIPMENT_STATUS_LABEL_KEYS',
      () => EQUIPMENT_STATUS_LABEL_KEYS,
      'EQUIPMENT_STATUS_VALUES',
      () => EQUIPMENT_STATUS_VALUES,
      'EquipmentImportSourceEnum',
      () => EquipmentImportSourceEnum,
      'EquipmentImportStatusEnum',
      () => EquipmentImportStatusEnum,
      'EquipmentImportStatusValues',
      () => EquipmentImportStatusValues,
      'EquipmentStatusEnum',
      () => EquipmentStatusEnum,
      'EquipmentStatusValues',
      () => EquipmentStatusValues,
      'INCIDENT_TYPE_LABELS',
      () => INCIDENT_TYPE_LABELS,
      'INCIDENT_TYPE_VALUES',
      () => INCIDENT_TYPE_VALUES,
      'IncidentTypeEnum',
      () => IncidentTypeEnum,
      'IncidentTypeValues',
      () => IncidentTypeValues,
      'LOCATION_VALUES',
      () => LOCATION_VALUES,
      'LocationEnum',
      () => LocationEnum,
      'MANAGEMENT_NUMBER_PATTERN',
      () => MANAGEMENT_NUMBER_PATTERN,
      'NON_CONFORMANCE_STATUS_LABELS',
      () => NON_CONFORMANCE_STATUS_LABELS,
      'NON_CONFORMANCE_STATUS_VALUES',
      () => NON_CONFORMANCE_STATUS_VALUES,
      'NON_CONFORMANCE_TYPE_LABELS',
      () => NON_CONFORMANCE_TYPE_LABELS,
      'NON_CONFORMANCE_TYPE_VALUES',
      () => NON_CONFORMANCE_TYPE_VALUES,
      'NOTIFICATION_FREQUENCY_VALUES',
      () => NOTIFICATION_FREQUENCY_VALUES,
      'NOTIFICATION_PRIORITY_LABELS',
      () => NOTIFICATION_PRIORITY_LABELS,
      'NOTIFICATION_PRIORITY_VALUES',
      () => NOTIFICATION_PRIORITY_VALUES,
      'NOTIFICATION_TYPE_VALUES',
      () => NOTIFICATION_TYPE_VALUES,
      'NonConformanceStatusEnum',
      () => NonConformanceStatusEnum,
      'NonConformanceStatusValues',
      () => NonConformanceStatusValues,
      'NonConformanceTypeEnum',
      () => NonConformanceTypeEnum,
      'NonConformanceTypeValues',
      () => NonConformanceTypeValues,
      'NotificationFrequencyEnum',
      () => NotificationFrequencyEnum,
      'NotificationPriorityEnum',
      () => NotificationPriorityEnum,
      'NotificationPriorityValues',
      () => NotificationPriorityValues,
      'NotificationTypeEnum',
      () => NotificationTypeEnum,
      'NotificationTypeValues',
      () => NotificationTypeValues,
      'REJECTION_STAGE_VALUES',
      () => REJECTION_STAGE_VALUES,
      'REPAIR_RESULT_LABELS',
      () => REPAIR_RESULT_LABELS,
      'REPAIR_RESULT_VALUES',
      () => REPAIR_RESULT_VALUES,
      'REPORT_FORMAT_VALUES',
      () => REPORT_FORMAT_VALUES,
      'REPORT_PERIOD_VALUES',
      () => REPORT_PERIOD_VALUES,
      'RESOLUTION_TYPE_LABELS',
      () => RESOLUTION_TYPE_LABELS,
      'RESOLUTION_TYPE_VALUES',
      () => RESOLUTION_TYPE_VALUES,
      'RETURN_APPROVAL_STATUS_VALUES',
      () => RETURN_APPROVAL_STATUS_VALUES,
      'RETURN_CONDITION_LABELS',
      () => RETURN_CONDITION_LABELS,
      'RETURN_CONDITION_VALUES',
      () => RETURN_CONDITION_VALUES,
      'RejectionStageEnum',
      () => RejectionStageEnum,
      'RepairResultEnum',
      () => RepairResultEnum,
      'RepairResultValues',
      () => RepairResultValues,
      'ReportFormatEnum',
      () => ReportFormatEnum,
      'ReportPeriodEnum',
      () => ReportPeriodEnum,
      'ResolutionTypeEnum',
      () => ResolutionTypeEnum,
      'ReturnApprovalStatusEnum',
      () => ReturnApprovalStatusEnum,
      'ReturnApprovalStatusValues',
      () => ReturnApprovalStatusValues,
      'ReturnConditionEnum',
      () => ReturnConditionEnum,
      'ReturnConditionValues',
      () => ReturnConditionValues,
      'SHARED_SOURCE_VALUES',
      () => SHARED_SOURCE_VALUES,
      'SITE_LABELS',
      () => SITE_LABELS,
      'SITE_TO_CODE',
      () => SITE_TO_CODE,
      'SITE_TO_LOCATION',
      () => SITE_TO_LOCATION,
      'SITE_VALUES',
      () => SITE_VALUES,
      'SOFTWARE_APPROVAL_STATUS_LABELS',
      () => SOFTWARE_APPROVAL_STATUS_LABELS,
      'SOFTWARE_APPROVAL_STATUS_VALUES',
      () => SOFTWARE_APPROVAL_STATUS_VALUES,
      'SOFTWARE_TYPE_LABELS',
      () => SOFTWARE_TYPE_LABELS,
      'SOFTWARE_TYPE_VALUES',
      () => SOFTWARE_TYPE_VALUES,
      'SORT_ORDER_VALUES',
      () => SORT_ORDER_VALUES,
      'SPEC_MATCH_VALUES',
      () => SPEC_MATCH_VALUES,
      'SharedSourceEnum',
      () => SharedSourceEnum,
      'SiteCodeEnum',
      () => SiteCodeEnum,
      'SiteEnum',
      () => SiteEnum,
      'SoftwareApprovalStatusEnum',
      () => SoftwareApprovalStatusEnum,
      'SoftwareApprovalStatusValues',
      () => SoftwareApprovalStatusValues,
      'SoftwareTypeEnum',
      () => SoftwareTypeEnum,
      'SortOrderEnum',
      () => SortOrderEnum,
      'SpecMatchEnum',
      () => SpecMatchEnum,
      'TEMPORARY_EQUIPMENT_PREFIX',
      () => TEMPORARY_EQUIPMENT_PREFIX,
      'TEMPORARY_MANAGEMENT_NUMBER_PATTERN',
      () => TEMPORARY_MANAGEMENT_NUMBER_PATTERN,
      'TeamIdSchema',
      () => TeamIdSchema,
      'UNIFIED_APPROVAL_STATUS_LABELS',
      () => UNIFIED_APPROVAL_STATUS_LABELS,
      'UNIFIED_APPROVAL_STATUS_VALUES',
      () => UNIFIED_APPROVAL_STATUS_VALUES,
      'USER_ROLE_LABELS',
      () => USER_ROLE_LABELS,
      'USER_ROLE_VALUES',
      () => USER_ROLE_VALUES,
      'USER_STATUS_LABELS',
      () => USER_STATUS_LABELS,
      'USER_STATUS_VALUES',
      () => USER_STATUS_VALUES,
      'UnifiedApprovalStatusEnum',
      () => UnifiedApprovalStatusEnum,
      'UnifiedApprovalStatusValues',
      () => UnifiedApprovalStatusValues,
      'UserRoleEnum',
      () => UserRoleEnum,
      'UserRoleValues',
      () => UserRoleValues,
      'UserStatusEnum',
      () => UserStatusEnum,
      'UserStatusValues',
      () => UserStatusValues,
      'findCheckoutStatusGroupKey',
      () => findCheckoutStatusGroupKey,
      'generateManagementNumber',
      () => generateManagementNumber,
      'generateTemporaryManagementNumber',
      () => generateTemporaryManagementNumber,
      'getCheckoutStatusGroupFilterValue',
      () => getCheckoutStatusGroupFilterValue,
      'isTemporaryManagementNumber',
      () => isTemporaryManagementNumber,
      'parseManagementNumber',
      () => parseManagementNumber,
      'parseTemporaryManagementNumber',
      () => parseTemporaryManagementNumber,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    const EquipmentStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum([
        'available',
        'in_use',
        'checked_out',
        'calibration_scheduled',
        'calibration_overdue',
        'non_conforming',
        'spare',
        'retired',
        'pending_disposal',
        'disposed',
        'temporary',
        'inactive',
      ]);
    const CalibrationMethodEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['external_calibration', 'self_inspection', 'not_applicable']);
    const UserRoleEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum([
        'test_engineer',
        'technical_manager',
        'quality_manager',
        'lab_manager',
        'system_admin',
      ]);
    const SiteEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['suwon', 'uiwang', 'pyeongtaek']);
    const SITE_VALUES = SiteEnum.options;
    const LocationEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['수원랩', '의왕랩', '평택랩']);
    const SITE_TO_LOCATION = {
      suwon: '수원랩',
      uiwang: '의왕랩',
      pyeongtaek: '평택랩',
    };
    const SiteCodeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['SUW', 'UIW', 'PYT']);
    const ClassificationEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['fcc_emc_rf', 'general_emc', 'general_rf', 'sar', 'automotive_emc', 'software']);
    const ClassificationCodeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['E', 'R', 'W', 'S', 'A', 'P']);
    const SITE_TO_CODE = {
      suwon: 'SUW',
      uiwang: 'UIW',
      pyeongtaek: 'PYT',
    };
    const CODE_TO_SITE = {
      SUW: 'suwon',
      UIW: 'uiwang',
      PYT: 'pyeongtaek',
    };
    const CLASSIFICATION_TO_CODE = {
      fcc_emc_rf: 'E',
      general_emc: 'R',
      general_rf: 'W',
      sar: 'S',
      automotive_emc: 'A',
      software: 'P',
    };
    const CODE_TO_CLASSIFICATION = {
      E: 'fcc_emc_rf',
      R: 'general_emc',
      W: 'general_rf',
      S: 'sar',
      A: 'automotive_emc',
      P: 'software',
    };
    const CLASSIFICATION_LABELS = {
      fcc_emc_rf: 'FCC EMC/RF',
      general_emc: 'General EMC',
      general_rf: 'General RF',
      sar: 'SAR',
      automotive_emc: 'Automotive EMC',
      software: 'Software Program',
    };
    const SITE_LABELS = {
      suwon: '수원',
      uiwang: '의왕',
      pyeongtaek: '평택',
    };
    const MANAGEMENT_NUMBER_PATTERN = /^(SUW|UIW|PYT)-[ERWSAP]\d{4}$/;
    const TEMPORARY_EQUIPMENT_PREFIX = 'TEMP-';
    const TEMPORARY_MANAGEMENT_NUMBER_PATTERN = /^TEMP-(SUW|UIW|PYT)-[ERWSAP]\d{4}$/;
    function generateManagementNumber(site, classification, serialNumber) {
      const siteCode = SITE_TO_CODE[site];
      const classificationCode = CLASSIFICATION_TO_CODE[classification];
      return `${siteCode}-${classificationCode}${serialNumber}`;
    }
    function parseManagementNumber(managementNumber) {
      const match = managementNumber.match(MANAGEMENT_NUMBER_PATTERN);
      if (!match) {
        return null;
      }
      const siteCode = managementNumber.substring(0, 3);
      const classificationCode = managementNumber.charAt(4);
      const serialNumber = managementNumber.substring(5);
      return {
        siteCode,
        site: CODE_TO_SITE[siteCode],
        classificationCode,
        classification: CODE_TO_CLASSIFICATION[classificationCode],
        serialNumber,
      };
    }
    function generateTemporaryManagementNumber(site, classification, serialNumber) {
      const siteCode = SITE_TO_CODE[site];
      const classificationCode = CLASSIFICATION_TO_CODE[classification];
      return `${TEMPORARY_EQUIPMENT_PREFIX}${siteCode}-${classificationCode}${serialNumber}`;
    }
    function parseTemporaryManagementNumber(managementNumber) {
      const match = managementNumber.match(TEMPORARY_MANAGEMENT_NUMBER_PATTERN);
      if (!match) {
        return null;
      }
      // "TEMP-SUW-E0001" → substring(5) = "SUW-E0001"
      const withoutPrefix = managementNumber.substring(5);
      const siteCode = withoutPrefix.substring(0, 3);
      const classificationCode = withoutPrefix.charAt(4);
      const serialNumber = withoutPrefix.substring(5);
      return {
        siteCode,
        site: CODE_TO_SITE[siteCode],
        classificationCode,
        classification: CODE_TO_CLASSIFICATION[classificationCode],
        serialNumber,
      };
    }
    function isTemporaryManagementNumber(managementNumber) {
      return managementNumber.startsWith(TEMPORARY_EQUIPMENT_PREFIX);
    }
    const TeamIdSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ]
        .string()
        .uuid()
        .optional();
    const CHECKOUT_STATUS_VALUES = [
      'pending',
      'approved',
      'rejected',
      'checked_out',
      // 대여 목적 양측 확인 상태 (시험소간 대여)
      'lender_checked',
      'borrower_received',
      'in_use',
      'borrower_returned',
      'lender_received',
      'returned',
      'return_approved',
      'overdue',
      'canceled',
    ];
    const CheckoutStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CHECKOUT_STATUS_VALUES);
    _c = CheckoutStatusEnum;
    const CHECKOUT_PURPOSE_VALUES = ['calibration', 'repair', 'rental', 'return_to_vendor'];
    const CheckoutPurposeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CHECKOUT_PURPOSE_VALUES);
    _c1 = CheckoutPurposeEnum;
    const CALIBRATION_APPROVAL_STATUS_VALUES = ['pending_approval', 'approved', 'rejected'];
    const CalibrationApprovalStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CALIBRATION_APPROVAL_STATUS_VALUES);
    _c2 = CalibrationApprovalStatusEnum;
    const CALIBRATION_REGISTERED_BY_ROLE_VALUES = ['test_engineer', 'technical_manager'];
    const CalibrationRegisteredByRoleEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CALIBRATION_REGISTERED_BY_ROLE_VALUES);
    _c3 = CalibrationRegisteredByRoleEnum;
    const CALIBRATION_RESULT_VALUES = ['pass', 'fail', 'conditional'];
    const CalibrationResultEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CALIBRATION_RESULT_VALUES);
    _c4 = CalibrationResultEnum;
    const CALIBRATION_RESULT_LABELS = {
      pass: '적합',
      fail: '부적합',
      conditional: '조건부 적합',
    };
    const CHECKOUT_TYPE_VALUES = ['calibration', 'repair', 'rental'];
    const CheckoutTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CHECKOUT_TYPE_VALUES);
    _c5 = CheckoutTypeEnum;
    const CALIBRATION_FACTOR_TYPE_VALUES = [
      'antenna_gain',
      'cable_loss',
      'path_loss',
      'amplifier_gain',
      'other',
    ];
    const CalibrationFactorTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CALIBRATION_FACTOR_TYPE_VALUES);
    _c6 = CalibrationFactorTypeEnum;
    const CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES = ['pending', 'approved', 'rejected'];
    const CalibrationFactorApprovalStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES);
    _c7 = CalibrationFactorApprovalStatusEnum;
    const NON_CONFORMANCE_STATUS_VALUES = ['open', 'corrected', 'closed'];
    const NonConformanceStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(NON_CONFORMANCE_STATUS_VALUES);
    _c8 = NonConformanceStatusEnum;
    const SHARED_SOURCE_VALUES = ['safety_lab', 'external', 'internal_shared'];
    const SharedSourceEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(SHARED_SOURCE_VALUES);
    _c9 = SharedSourceEnum;
    const SOFTWARE_TYPE_VALUES = ['measurement', 'analysis', 'control', 'other'];
    const SoftwareTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(SOFTWARE_TYPE_VALUES);
    _c10 = SoftwareTypeEnum;
    const SOFTWARE_APPROVAL_STATUS_VALUES = ['pending', 'approved', 'rejected'];
    const SoftwareApprovalStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(SOFTWARE_APPROVAL_STATUS_VALUES);
    _c11 = SoftwareApprovalStatusEnum;
    const CALIBRATION_PLAN_STATUS_VALUES = [
      'draft',
      'pending_review',
      'pending_approval',
      'approved',
      'rejected',
    ];
    const CalibrationPlanStatusValues = {
      DRAFT: 'draft',
      PENDING_REVIEW: 'pending_review',
      PENDING_APPROVAL: 'pending_approval',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    const CalibrationPlanStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CALIBRATION_PLAN_STATUS_VALUES);
    _c12 = CalibrationPlanStatusEnum;
    const REJECTION_STAGE_VALUES = ['review', 'approval'];
    const RejectionStageEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(REJECTION_STAGE_VALUES);
    _c13 = RejectionStageEnum;
    const AUDIT_ACTION_VALUES = [
      'create',
      'update',
      'delete',
      'approve',
      'reject',
      'checkout',
      'return',
      'cancel',
      'login',
      'logout',
      'close',
      'reject_correction',
    ];
    const AuditActionEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(AUDIT_ACTION_VALUES);
    _c14 = AuditActionEnum;
    const AUDIT_ENTITY_TYPE_VALUES = [
      'equipment',
      'calibration',
      'checkout',
      'rental',
      'rental_import',
      'user',
      'team',
      'calibration_factor',
      'non_conformance',
      'software',
      'calibration_plan',
      'repair_history',
      'equipment_import',
      'location_history',
      'maintenance_history',
      'incident_history',
      'settings',
    ];
    const AuditEntityTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(AUDIT_ENTITY_TYPE_VALUES);
    _c15 = AuditEntityTypeEnum;
    const INCIDENT_TYPE_VALUES = [
      'damage',
      'malfunction',
      'change',
      'repair',
      'calibration_overdue',
    ];
    const IncidentTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(INCIDENT_TYPE_VALUES);
    _c16 = IncidentTypeEnum;
    const SPEC_MATCH_VALUES = ['match', 'mismatch'];
    const SpecMatchEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(SPEC_MATCH_VALUES);
    _c17 = SpecMatchEnum;
    const CALIBRATION_REQUIRED_VALUES = ['required', 'not_required'];
    const CalibrationRequiredEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CALIBRATION_REQUIRED_VALUES);
    _c18 = CalibrationRequiredEnum;
    const LOCATION_VALUES = LocationEnum.options;
    const NON_CONFORMANCE_TYPE_VALUES = [
      'damage',
      'malfunction',
      'calibration_failure',
      'calibration_overdue',
      'measurement_error',
      'other',
    ];
    const NonConformanceTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(NON_CONFORMANCE_TYPE_VALUES);
    _c19 = NonConformanceTypeEnum;
    const RESOLUTION_TYPE_VALUES = ['repair', 'recalibration', 'replacement', 'disposal', 'other'];
    const ResolutionTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(RESOLUTION_TYPE_VALUES);
    _c20 = ResolutionTypeEnum;
    const USER_STATUS_VALUES = ['active', 'inactive', 'pending'];
    const UserStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(USER_STATUS_VALUES);
    _c21 = UserStatusEnum;
    const REPAIR_RESULT_VALUES = ['completed', 'partial', 'failed'];
    const RepairResultEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(REPAIR_RESULT_VALUES);
    _c22 = RepairResultEnum;
    const NOTIFICATION_TYPE_VALUES = [
      // ─── 반출 (Checkout) ───
      'checkout_created',
      'checkout_approved',
      'checkout_rejected',
      'checkout_started',
      'checkout_returned',
      'checkout_return_approved',
      'checkout_overdue',
      // ─── 교정 (Calibration) ───
      'calibration_created',
      'calibration_approved',
      'calibration_rejected',
      'calibration_due_soon',
      'calibration_overdue',
      // ─── 부적합 (Non-Conformance) ───
      'non_conformance_created',
      'non_conformance_corrected',
      'non_conformance_closed',
      'non_conformance_correction_rejected',
      // ─── 장비 요청 (Equipment Request) ───
      'equipment_request_created',
      'equipment_request_approved',
      'equipment_request_rejected',
      // ─── 폐기 (Disposal) ───
      'disposal_requested',
      'disposal_reviewed',
      'disposal_approved',
      'disposal_rejected',
      // ─── 장비 반입 (Equipment Import) ───
      'equipment_import_created',
      'equipment_import_approved',
      'equipment_import_rejected',
      // ─── 시스템 ───
      'system_announcement',
      // ─── 레거시 호환 (기존 코드에서 참조) ───
      'calibration_due',
      'calibration_completed',
      'calibration_approval_pending',
      'intermediate_check_due',
      'rental_request',
      'rental_approved',
      'rental_rejected',
      'rental_completed',
      'return_requested',
      'return_approved',
      'return_rejected',
      'equipment_maintenance',
      'system',
      'checkout',
      'maintenance',
    ];
    const NotificationTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(NOTIFICATION_TYPE_VALUES);
    _c23 = NotificationTypeEnum;
    const NOTIFICATION_PRIORITY_VALUES = ['low', 'medium', 'high'];
    const NotificationPriorityEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(NOTIFICATION_PRIORITY_VALUES);
    _c24 = NotificationPriorityEnum;
    const RETURN_CONDITION_VALUES = [
      'good',
      'damaged',
      'lost',
      'needs_repair',
      'needs_calibration',
    ];
    const ReturnConditionEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(RETURN_CONDITION_VALUES);
    _c25 = ReturnConditionEnum;
    const RETURN_APPROVAL_STATUS_VALUES = ['pending', 'approved', 'rejected'];
    const ReturnApprovalStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(RETURN_APPROVAL_STATUS_VALUES);
    _c26 = ReturnApprovalStatusEnum;
    const CONDITION_CHECK_STEP_VALUES = [
      'lender_checkout',
      'borrower_receive',
      'borrower_return',
      'lender_return',
    ];
    const ConditionCheckStepEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CONDITION_CHECK_STEP_VALUES);
    _c27 = ConditionCheckStepEnum;
    const CONDITION_STATUS_VALUES = ['normal', 'abnormal'];
    const ConditionStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CONDITION_STATUS_VALUES);
    _c28 = ConditionStatusEnum;
    const ACCESSORIES_STATUS_VALUES = ['complete', 'incomplete'];
    const AccessoriesStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(ACCESSORIES_STATUS_VALUES);
    _c29 = AccessoriesStatusEnum;
    const EQUIPMENT_STATUS_VALUES = EquipmentStatusEnum.options;
    const EQUIPMENT_STATUS_LABELS = {
      available: '사용 가능',
      in_use: '사용 중',
      checked_out: '반출 중',
      calibration_scheduled: '교정 예정',
      calibration_overdue: '교정 기한 초과',
      non_conforming: '부적합',
      spare: '여분',
      retired: '폐기',
      pending_disposal: '폐기대기',
      disposed: '폐기완료',
      temporary: '임시등록',
      inactive: '비활성',
    };
    const EQUIPMENT_STATUS_LABEL_KEYS = {
      available: 'status.available',
      in_use: 'status.in_use',
      checked_out: 'status.checked_out',
      calibration_scheduled: 'status.calibration_scheduled',
      calibration_overdue: 'status.calibration_overdue',
      non_conforming: 'status.non_conforming',
      spare: 'status.spare',
      retired: 'status.retired',
      pending_disposal: 'status.pending_disposal',
      disposed: 'status.disposed',
      temporary: 'status.temporary',
      inactive: 'status.inactive',
    };
    const EQUIPMENT_STATUS_FILTER_OPTIONS = [
      'available',
      'in_use',
      'checked_out',
      'calibration_overdue',
      'non_conforming',
      'spare',
      'pending_disposal',
      'disposed',
    ];
    const CHECKOUT_STATUS_FILTER_OPTIONS = [
      'pending',
      'approved',
      'checked_out',
      'returned',
      'return_approved',
      'overdue',
      'rejected',
      'canceled',
      'lender_checked',
      'borrower_received',
      'in_use',
      'borrower_returned',
      'lender_received',
    ];
    const CHECKOUT_STATUS_GROUPS = {
      /** 진행 중 (반출~반입 전 모든 단계) */ in_progress: [
        'checked_out',
        'lender_checked',
        'borrower_received',
        'in_use',
        'borrower_returned',
        'lender_received',
      ],
      /** 반입 완료 (반입됨 + 반입 승인) */ completed: ['returned', 'return_approved'],
    };
    function getCheckoutStatusGroupFilterValue(groupKey) {
      return CHECKOUT_STATUS_GROUPS[groupKey].join(',');
    }
    function findCheckoutStatusGroupKey(filterValue) {
      for (const [key, statuses] of Object.entries(CHECKOUT_STATUS_GROUPS)) {
        if (statuses.join(',') === filterValue) {
          return key;
        }
      }
      return null;
    }
    const CALIBRATION_METHOD_VALUES = CalibrationMethodEnum.options;
    const CALIBRATION_METHOD_LABELS = {
      external_calibration: '외부 교정',
      self_inspection: '자체 점검',
      not_applicable: '비대상',
    };
    const USER_ROLE_VALUES = UserRoleEnum.options;
    const USER_ROLE_LABELS = {
      test_engineer: '시험실무자',
      technical_manager: '기술책임자',
      quality_manager: '품질책임자',
      lab_manager: '시험소장',
      system_admin: '시스템 관리자',
    };
    const CHECKOUT_STATUS_LABELS = {
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거절됨',
      checked_out: '반출 중',
      // 대여 목적 양측 확인 상태 라벨
      lender_checked: '반출 전 확인 완료',
      borrower_received: '인수 확인 완료',
      in_use: '사용 중',
      borrower_returned: '반납 전 확인 완료',
      lender_received: '반입 확인 완료',
      returned: '반입 완료',
      return_approved: '반입 승인됨',
      overdue: '기한 초과',
      canceled: '취소됨',
    };
    const CHECKOUT_PURPOSE_LABELS = {
      calibration: '교정',
      repair: '수리',
      rental: '대여',
      return_to_vendor: '렌탈 반납',
    };
    const NON_CONFORMANCE_STATUS_LABELS = {
      open: '등록됨',
      corrected: '조치 완료',
      closed: '종료됨',
    };
    const NON_CONFORMANCE_TYPE_LABELS = {
      damage: '손상',
      malfunction: '오작동',
      calibration_failure: '교정 실패',
      calibration_overdue: '교정 기한 초과',
      measurement_error: '측정 오류',
      other: '기타',
    };
    const RESOLUTION_TYPE_LABELS = {
      repair: '수리',
      recalibration: '재교정',
      replacement: '교체',
      disposal: '폐기',
      other: '기타',
    };
    const REPAIR_RESULT_LABELS = {
      completed: '완료',
      partial: '부분 완료',
      failed: '실패',
    };
    const USER_STATUS_LABELS = {
      active: '활성',
      inactive: '비활성',
      pending: '승인 대기',
    };
    const NOTIFICATION_PRIORITY_LABELS = {
      low: '낮음',
      medium: '보통',
      high: '높음',
    };
    const RETURN_CONDITION_LABELS = {
      good: '양호',
      damaged: '손상',
      lost: '분실',
      needs_repair: '수리 필요',
      needs_calibration: '교정 필요',
    };
    const CALIBRATION_FACTOR_TYPE_LABELS = {
      antenna_gain: '안테나 이득',
      cable_loss: '케이블 손실',
      path_loss: '경로 손실',
      amplifier_gain: '증폭기 이득',
      other: '기타',
    };
    const SOFTWARE_TYPE_LABELS = {
      measurement: '측정 소프트웨어',
      analysis: '분석 소프트웨어',
      control: '제어 소프트웨어',
      other: '기타',
    };
    const INCIDENT_TYPE_LABELS = {
      damage: '손상',
      malfunction: '오작동',
      change: '변경',
      repair: '수리',
      calibration_overdue: '교정 기한 초과',
    };
    const CALIBRATION_PLAN_STATUS_LABELS = {
      draft: '작성 중',
      pending_review: '확인 대기',
      pending_approval: '승인 대기',
      approved: '승인됨',
      rejected: '반려됨',
    };
    const CALIBRATION_APPROVAL_STATUS_LABELS = {
      pending_approval: '승인 대기',
      approved: '승인됨',
      rejected: '반려됨',
    };
    const CalibrationApprovalStatusValues = {
      PENDING_APPROVAL: 'pending_approval',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    const CALIBRATION_FACTOR_APPROVAL_STATUS_LABELS = {
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '반려됨',
    };
    const SOFTWARE_APPROVAL_STATUS_LABELS = {
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '반려됨',
    };
    const CONDITION_CHECK_STEP_LABELS = {
      lender_checkout: '① 반출 전 확인 (빌려주는 측)',
      borrower_receive: '② 인수 시 확인 (빌리는 측)',
      borrower_return: '③ 반납 전 확인 (빌린 측)',
      lender_return: '④ 반입 시 확인 (빌려준 측)',
    };
    const CONDITION_STATUS_LABELS = {
      normal: '정상',
      abnormal: '이상',
    };
    const ACCESSORIES_STATUS_LABELS = {
      complete: '완전',
      incomplete: '불완전',
    };
    const NotificationPriorityValues = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
    };
    const NotificationTypeValues = {
      // 신규 이벤트 기반 타입
      CHECKOUT_CREATED: 'checkout_created',
      CHECKOUT_APPROVED: 'checkout_approved',
      CHECKOUT_REJECTED: 'checkout_rejected',
      CHECKOUT_STARTED: 'checkout_started',
      CHECKOUT_RETURNED: 'checkout_returned',
      CHECKOUT_RETURN_APPROVED: 'checkout_return_approved',
      CHECKOUT_OVERDUE: 'checkout_overdue',
      CALIBRATION_CREATED: 'calibration_created',
      CALIBRATION_APPROVED: 'calibration_approved',
      CALIBRATION_REJECTED: 'calibration_rejected',
      CALIBRATION_DUE_SOON: 'calibration_due_soon',
      CALIBRATION_OVERDUE: 'calibration_overdue',
      NON_CONFORMANCE_CREATED: 'non_conformance_created',
      NON_CONFORMANCE_CORRECTED: 'non_conformance_corrected',
      NON_CONFORMANCE_CLOSED: 'non_conformance_closed',
      NON_CONFORMANCE_CORRECTION_REJECTED: 'non_conformance_correction_rejected',
      EQUIPMENT_REQUEST_CREATED: 'equipment_request_created',
      EQUIPMENT_REQUEST_APPROVED: 'equipment_request_approved',
      EQUIPMENT_REQUEST_REJECTED: 'equipment_request_rejected',
      DISPOSAL_REQUESTED: 'disposal_requested',
      DISPOSAL_REVIEWED: 'disposal_reviewed',
      DISPOSAL_APPROVED: 'disposal_approved',
      DISPOSAL_REJECTED: 'disposal_rejected',
      EQUIPMENT_IMPORT_CREATED: 'equipment_import_created',
      EQUIPMENT_IMPORT_APPROVED: 'equipment_import_approved',
      EQUIPMENT_IMPORT_REJECTED: 'equipment_import_rejected',
      SYSTEM_ANNOUNCEMENT: 'system_announcement',
      // 레거시 호환
      CALIBRATION_DUE: 'calibration_due',
      CALIBRATION_COMPLETED: 'calibration_completed',
      CALIBRATION_APPROVAL_PENDING: 'calibration_approval_pending',
      INTERMEDIATE_CHECK_DUE: 'intermediate_check_due',
      RENTAL_REQUEST: 'rental_request',
      RENTAL_APPROVED: 'rental_approved',
      RENTAL_REJECTED: 'rental_rejected',
      RENTAL_COMPLETED: 'rental_completed',
      RETURN_REQUESTED: 'return_requested',
      RETURN_APPROVED: 'return_approved',
      RETURN_REJECTED: 'return_rejected',
      EQUIPMENT_MAINTENANCE: 'equipment_maintenance',
      SYSTEM: 'system',
      CHECKOUT: 'checkout',
      MAINTENANCE: 'maintenance',
    };
    const ReturnConditionValues = {
      GOOD: 'good',
      DAMAGED: 'damaged',
      LOST: 'lost',
      NEEDS_REPAIR: 'needs_repair',
      NEEDS_CALIBRATION: 'needs_calibration',
    };
    const ReturnApprovalStatusValues = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    const RepairResultValues = {
      COMPLETED: 'completed',
      PARTIAL: 'partial',
      FAILED: 'failed',
    };
    const SoftwareApprovalStatusValues = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    const CalibrationFactorTypeValues = {
      ANTENNA_GAIN: 'antenna_gain',
      CABLE_LOSS: 'cable_loss',
      PATH_LOSS: 'path_loss',
      AMPLIFIER_GAIN: 'amplifier_gain',
      OTHER: 'other',
    };
    const IncidentTypeValues = {
      DAMAGE: 'damage',
      MALFUNCTION: 'malfunction',
      CHANGE: 'change',
      REPAIR: 'repair',
      CALIBRATION_OVERDUE: 'calibration_overdue',
    };
    const NonConformanceTypeValues = {
      DAMAGE: 'damage',
      MALFUNCTION: 'malfunction',
      CALIBRATION_FAILURE: 'calibration_failure',
      CALIBRATION_OVERDUE: 'calibration_overdue',
      MEASUREMENT_ERROR: 'measurement_error',
      OTHER: 'other',
    };
    const NonConformanceStatusValues = {
      OPEN: 'open',
      CORRECTED: 'corrected',
      CLOSED: 'closed',
    };
    const EquipmentStatusValues = {
      AVAILABLE: 'available',
      IN_USE: 'in_use',
      CHECKED_OUT: 'checked_out',
      CALIBRATION_SCHEDULED: 'calibration_scheduled',
      CALIBRATION_OVERDUE: 'calibration_overdue',
      NON_CONFORMING: 'non_conforming',
      SPARE: 'spare',
      RETIRED: 'retired',
      PENDING_DISPOSAL: 'pending_disposal',
      DISPOSED: 'disposed',
      TEMPORARY: 'temporary',
      INACTIVE: 'inactive',
    };
    const UserRoleValues = {
      TEST_ENGINEER: 'test_engineer',
      TECHNICAL_MANAGER: 'technical_manager',
      QUALITY_MANAGER: 'quality_manager',
      LAB_MANAGER: 'lab_manager',
      SYSTEM_ADMIN: 'system_admin',
    };
    const UserStatusValues = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'pending',
    };
    const CalibrationFactorApprovalStatusValues = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    const CheckoutStatusValues = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      CHECKED_OUT: 'checked_out',
      LENDER_CHECKED: 'lender_checked',
      BORROWER_RECEIVED: 'borrower_received',
      IN_USE: 'in_use',
      BORROWER_RETURNED: 'borrower_returned',
      LENDER_RECEIVED: 'lender_received',
      RETURNED: 'returned',
      RETURN_APPROVED: 'return_approved',
      OVERDUE: 'overdue',
      CANCELED: 'canceled',
    };
    const CheckoutPurposeValues = {
      CALIBRATION: 'calibration',
      REPAIR: 'repair',
      RENTAL: 'rental',
      RETURN_TO_VENDOR: 'return_to_vendor',
    };
    const ConditionCheckStepValues = {
      LENDER_CHECKOUT: 'lender_checkout',
      BORROWER_RECEIVE: 'borrower_receive',
      BORROWER_RETURN: 'borrower_return',
      LENDER_RETURN: 'lender_return',
    };
    const ConditionStatusValues = {
      NORMAL: 'normal',
      ABNORMAL: 'abnormal',
    };
    const AccessoriesStatusValues = {
      COMPLETE: 'complete',
      INCOMPLETE: 'incomplete',
    };
    const UNIFIED_APPROVAL_STATUS_VALUES = [
      'pending',
      'pending_review',
      'reviewed',
      'approved',
      'rejected',
    ];
    const UnifiedApprovalStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(UNIFIED_APPROVAL_STATUS_VALUES);
    _c30 = UnifiedApprovalStatusEnum;
    const UNIFIED_APPROVAL_STATUS_LABELS = {
      pending: '대기',
      pending_review: '검토 대기',
      reviewed: '검토 완료',
      approved: '승인 완료',
      rejected: '반려',
    };
    const UnifiedApprovalStatusValues = {
      PENDING: 'pending',
      PENDING_REVIEW: 'pending_review',
      REVIEWED: 'reviewed',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    const DISPOSAL_REASON_VALUES = ['obsolete', 'broken', 'inaccurate', 'other'];
    const DisposalReasonEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(DISPOSAL_REASON_VALUES);
    _c31 = DisposalReasonEnum;
    const DISPOSAL_REASON_LABELS = {
      obsolete: '노후화',
      broken: '고장 (수리 불가)',
      inaccurate: '정밀도/정확도 미보장',
      other: '기타',
    };
    const DISPOSAL_REVIEW_STATUS_VALUES = ['pending', 'reviewed', 'approved', 'rejected'];
    const DisposalReviewStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(DISPOSAL_REVIEW_STATUS_VALUES);
    _c32 = DisposalReviewStatusEnum;
    const DISPOSAL_REVIEW_STATUS_LABELS = {
      pending: '검토 대기',
      reviewed: '검토 완료',
      approved: '승인 완료',
      rejected: '반려됨',
    };
    const DisposalReviewStatusValues = {
      PENDING: 'pending',
      REVIEWED: 'reviewed',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    const EQUIPMENT_IMPORT_SOURCE_VALUES = ['rental', 'internal_shared'];
    const EquipmentImportSourceEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(EQUIPMENT_IMPORT_SOURCE_VALUES);
    _c33 = EquipmentImportSourceEnum;
    const EQUIPMENT_IMPORT_SOURCE_LABELS = {
      rental: '외부 렌탈',
      internal_shared: '내부 공용',
    };
    const EQUIPMENT_IMPORT_STATUS_VALUES = [
      'pending',
      'approved',
      'rejected',
      'received',
      'return_requested',
      'returned',
      'canceled',
    ];
    const EquipmentImportStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(EQUIPMENT_IMPORT_STATUS_VALUES);
    _c34 = EquipmentImportStatusEnum;
    const EQUIPMENT_IMPORT_STATUS_LABELS = {
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거절됨',
      received: '수령 완료',
      return_requested: '반납 진행 중',
      returned: '반납 완료',
      canceled: '취소됨',
    };
    const EquipmentImportStatusValues = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      RECEIVED: 'received',
      RETURN_REQUESTED: 'return_requested',
      RETURNED: 'returned',
      CANCELED: 'canceled',
    };
    const NotificationFrequencyEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['immediate', 'daily', 'weekly']);
    const NOTIFICATION_FREQUENCY_VALUES = NotificationFrequencyEnum.options;
    const APPROVAL_ACTION_VALUES = ['approve', 'reject'];
    const ApprovalActionEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(APPROVAL_ACTION_VALUES);
    _c35 = ApprovalActionEnum;
    const REPORT_FORMAT_VALUES = ['excel', 'csv', 'pdf'];
    const ReportFormatEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(REPORT_FORMAT_VALUES);
    _c36 = ReportFormatEnum;
    const REPORT_PERIOD_VALUES = ['week', 'month', 'quarter', 'year'];
    const ReportPeriodEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(REPORT_PERIOD_VALUES);
    _c37 = ReportPeriodEnum;
    const SORT_ORDER_VALUES = ['asc', 'desc'];
    const SortOrderEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(SORT_ORDER_VALUES);
    _c38 = SortOrderEnum;
    const CHECKOUT_DIRECTION_VALUES = ['outbound', 'inbound'];
    const CheckoutDirectionEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(CHECKOUT_DIRECTION_VALUES);
    _c39 = CheckoutDirectionEnum;
    var _c,
      _c1,
      _c2,
      _c3,
      _c4,
      _c5,
      _c6,
      _c7,
      _c8,
      _c9,
      _c10,
      _c11,
      _c12,
      _c13,
      _c14,
      _c15,
      _c16,
      _c17,
      _c18,
      _c19,
      _c20,
      _c21,
      _c22,
      _c23,
      _c24,
      _c25,
      _c26,
      _c27,
      _c28,
      _c29,
      _c30,
      _c31,
      _c32,
      _c33,
      _c34,
      _c35,
      _c36,
      _c37,
      _c38,
      _c39;
    __turbopack_context__.k.register(_c, 'CheckoutStatusEnum');
    __turbopack_context__.k.register(_c1, 'CheckoutPurposeEnum');
    __turbopack_context__.k.register(_c2, 'CalibrationApprovalStatusEnum');
    __turbopack_context__.k.register(_c3, 'CalibrationRegisteredByRoleEnum');
    __turbopack_context__.k.register(_c4, 'CalibrationResultEnum');
    __turbopack_context__.k.register(_c5, 'CheckoutTypeEnum');
    __turbopack_context__.k.register(_c6, 'CalibrationFactorTypeEnum');
    __turbopack_context__.k.register(_c7, 'CalibrationFactorApprovalStatusEnum');
    __turbopack_context__.k.register(_c8, 'NonConformanceStatusEnum');
    __turbopack_context__.k.register(_c9, 'SharedSourceEnum');
    __turbopack_context__.k.register(_c10, 'SoftwareTypeEnum');
    __turbopack_context__.k.register(_c11, 'SoftwareApprovalStatusEnum');
    __turbopack_context__.k.register(_c12, 'CalibrationPlanStatusEnum');
    __turbopack_context__.k.register(_c13, 'RejectionStageEnum');
    __turbopack_context__.k.register(_c14, 'AuditActionEnum');
    __turbopack_context__.k.register(_c15, 'AuditEntityTypeEnum');
    __turbopack_context__.k.register(_c16, 'IncidentTypeEnum');
    __turbopack_context__.k.register(_c17, 'SpecMatchEnum');
    __turbopack_context__.k.register(_c18, 'CalibrationRequiredEnum');
    __turbopack_context__.k.register(_c19, 'NonConformanceTypeEnum');
    __turbopack_context__.k.register(_c20, 'ResolutionTypeEnum');
    __turbopack_context__.k.register(_c21, 'UserStatusEnum');
    __turbopack_context__.k.register(_c22, 'RepairResultEnum');
    __turbopack_context__.k.register(_c23, 'NotificationTypeEnum');
    __turbopack_context__.k.register(_c24, 'NotificationPriorityEnum');
    __turbopack_context__.k.register(_c25, 'ReturnConditionEnum');
    __turbopack_context__.k.register(_c26, 'ReturnApprovalStatusEnum');
    __turbopack_context__.k.register(_c27, 'ConditionCheckStepEnum');
    __turbopack_context__.k.register(_c28, 'ConditionStatusEnum');
    __turbopack_context__.k.register(_c29, 'AccessoriesStatusEnum');
    __turbopack_context__.k.register(_c30, 'UnifiedApprovalStatusEnum');
    __turbopack_context__.k.register(_c31, 'DisposalReasonEnum');
    __turbopack_context__.k.register(_c32, 'DisposalReviewStatusEnum');
    __turbopack_context__.k.register(_c33, 'EquipmentImportSourceEnum');
    __turbopack_context__.k.register(_c34, 'EquipmentImportStatusEnum');
    __turbopack_context__.k.register(_c35, 'ApprovalActionEnum');
    __turbopack_context__.k.register(_c36, 'ReportFormatEnum');
    __turbopack_context__.k.register(_c37, 'ReportPeriodEnum');
    __turbopack_context__.k.register(_c38, 'SortOrderEnum');
    __turbopack_context__.k.register(_c39, 'CheckoutDirectionEnum');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
    // ============================================================================
    // DEPRECATED: Legacy rental import types (backward compatibility)
    // ============================================================================
  },
  '[project]/packages/schemas/src/common/base.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'PaginatedResponse',
      () => PaginatedResponse,
      'baseEntitySchema',
      () => baseEntitySchema,
      'paginationParamsSchema',
      () => paginationParamsSchema,
      'softDeleteEntitySchema',
      () => softDeleteEntitySchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    const baseEntitySchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
        updatedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
      });
    const softDeleteEntitySchema = baseEntitySchema.extend({
      deletedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .date()
          .nullable(),
    });
    const paginationParamsSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .int()
          .positive(),
        pageSize:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .max(100),
      });
    const PaginatedResponse = (schema) =>
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        items:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].array(schema),
        total:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .nonnegative(),
        page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .int()
          .positive(),
        pageSize:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive(),
        totalPages:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .nonnegative(),
      });
    _c = PaginatedResponse;
    var _c;
    __turbopack_context__.k.register(_c, 'PaginatedResponse');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/equipment.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'baseEquipmentSchema',
      () => baseEquipmentSchema,
      'createEquipmentSchema',
      () => createEquipmentSchema,
      'equipmentFilterSchema',
      () => equipmentFilterSchema,
      'equipmentListResponseSchema',
      () => equipmentListResponseSchema,
      'equipmentResponseSchema',
      () => equipmentResponseSchema,
      'equipmentSchema',
      () => equipmentSchema,
      'isEquipment',
      () => isEquipment,
      'updateEquipmentSchema',
      () => updateEquipmentSchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/common/base.ts [app-client] (ecmascript)'
      );
    const baseEquipmentSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        // 필수 필드 (생성 시에만 필수, 업데이트 시에는 .partial()로 선택적)
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .min(2)
          .max(100),
        managementNumber:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .min(2)
            .max(50),
        // 관리번호 컴포넌트 (선택적 - 서비스 레이어에서 파싱하여 자동 설정)
        // 관리번호 형식: XXX-XYYYY (시험소코드 3자리 - 분류코드 1자리 + 일련번호 4자리)
        siteCode:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SiteCodeEnum'
          ].optional(),
        classificationCode:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .enum(['E', 'R', 'W', 'S', 'A', 'P'])
            .optional(),
        managementSerialNumber:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .min(1)
            .max(9999)
            .optional(),
        classification:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ClassificationEnum'
          ].optional(),
        // 선택적 필드
        assetNumber:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        modelName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        manufacturer:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        manufacturerContact:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        serialNumber:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        location:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        description:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        // 시방일치 여부 및 교정필요 여부 (신규)
        specMatch:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SpecMatchEnum'
          ].optional(),
        calibrationRequired:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationRequiredEnum'
          ].optional(),
        // 교정 정보
        calibrationCycle:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .optional(),
        lastCalibrationDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .optional(),
        nextCalibrationDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .optional(),
        calibrationAgency:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        // 기본값이 있는 필드는 생성 시 선택적으로 처리 (서비스 레이어에서 기본값 적용)
        needsIntermediateCheck:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .boolean()
            .optional(),
        calibrationMethod:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationMethodEnum'
          ].optional(),
        // 중간점검 정보 (신규: 3개 필드로 분리)
        lastIntermediateCheckDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .optional(),
        intermediateCheckCycle:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .optional(),
        nextIntermediateCheckDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .optional(),
        // 관리 정보
        purchaseYear:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .min(1990)
            .max(2100)
            .optional(),
        purchaseDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .nullable()
            .optional(),
        price:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .nullable()
            .optional(),
        teamId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional()
            .nullable(),
        site: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SiteEnum'
        ],
        // 추가 정보
        supplier:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        contactInfo:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        softwareVersion:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        firmwareVersion:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        // 소프트웨어 정보 (프롬프트 9-1)
        softwareName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        softwareType:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SoftwareTypeEnum'
          ].optional(),
        manualLocation:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        accessories:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        mainFeatures:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        technicalManager:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        // 장비 타입 (DB와 동기화)
        equipmentType:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        // 위치 및 설치 정보 (신규)
        initialLocation:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        installationDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .optional(),
        // 승인 프로세스 필드
        approvalStatus:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .enum(['pending_approval', 'approved', 'rejected'])
            .optional(),
        requestedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        approvedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        // 추가 필드 (정리됨)
        calibrationResult:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        correctionFactor:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        // 상태 정보 (기본값이 있지만 생성 시 선택적)
        status:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'EquipmentStatusEnum'
          ].optional(),
        // 공용장비 필드 (프롬프트 8-1)
        // 기본값은 서비스 레이어에서 처리 (DB 기본값: false)
        isShared:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .boolean()
            .optional(),
        sharedSource:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SharedSourceEnum'
          ]
            .optional()
            .nullable(),
        owner:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional()
            .nullable(),
        externalIdentifier:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional()
            .nullable(),
        usagePeriodStart:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .optional()
            .nullable(),
        usagePeriodEnd:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .optional()
            .nullable(),
      });
    const createEquipmentSchema = baseEquipmentSchema;
    const updateEquipmentSchema = baseEquipmentSchema.partial();
    const equipmentSchema = baseEquipmentSchema.extend({
      id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ]
        .string()
        .uuid(),
      description:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .nullable()
          .optional(),
      isActive:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .boolean()
          .default(true),
      createdAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce.date(),
      updatedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce.date(),
      // DB에 있는 추가 필드들
      managerId:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .optional()
          .nullable(),
      intermediateCheckSchedule:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce
          .date()
          .optional()
          .nullable(),
      repairHistory:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .optional()
          .nullable(),
    });
    const equipmentFilterSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        search:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        status:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'EquipmentStatusEnum'
          ].optional(),
        teamId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        location:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        manufacturer:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        site: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SiteEnum'
        ].optional(),
        classification:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ClassificationEnum'
          ].optional(),
        classificationCode:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .enum(['E', 'R', 'W', 'S', 'A', 'P'])
            .optional(),
        calibrationMethod:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationMethodEnum'
          ].optional(),
        calibrationDue:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .number()
            .int()
            .positive()
            .optional(),
        calibrationDueAfter:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .number()
            .int()
            .positive()
            .optional(),
        calibrationOverdue:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .preprocess((val) => {
              if (val === 'true') return true;
              if (val === 'false') return false;
              return val;
            }, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__['z'].boolean())
            .optional(),
        sort: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .optional(),
        isShared:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .preprocess((val) => {
              if (val === 'true') return true;
              if (val === 'false') return false;
              return val;
            }, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__['z'].boolean())
            .optional(),
        // 페이지네이션은 선택적이며, 기본값은 서비스 레이어에서 처리
        page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce
          .number()
          .int()
          .positive()
          .optional()
          .default(1),
        pageSize:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .number()
            .int()
            .positive()
            .max(100)
            .optional()
            .default(20),
      });
    const equipmentResponseSchema = equipmentSchema.extend({
      teamName:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .nullable()
          .optional(),
    });
    const equipmentListResponseSchema = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'PaginatedResponse'
    ])(equipmentResponseSchema);
    const isEquipment = (value) => {
      try {
        return equipmentSchema.parse(value) !== null;
      } catch {
        return false;
      }
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/equipment-request.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'ApprovalStatusEnum',
      () => ApprovalStatusEnum,
      'RequestTypeEnum',
      () => RequestTypeEnum,
      'approveEquipmentRequestSchema',
      () => approveEquipmentRequestSchema,
      'createEquipmentRequestSchema',
      () => createEquipmentRequestSchema,
      'equipmentRequestSchema',
      () => equipmentRequestSchema,
      'isEquipmentRequest',
      () => isEquipmentRequest,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    const ApprovalStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['pending_approval', 'approved', 'rejected']);
    const RequestTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['create', 'update', 'delete']);
    const equipmentRequestSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .int()
          .positive(),
        uuid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        requestType: RequestTypeEnum,
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .nullable()
            .optional(),
        requestedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        requestedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        approvalStatus: ApprovalStatusEnum,
        approvedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .nullable()
            .optional(),
        approvedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce
            .date()
            .nullable()
            .optional(),
        rejectionReason:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .nullable()
            .optional(),
        requestData:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .nullable()
            .optional(),
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        updatedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
      });
    const createEquipmentRequestSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        requestType: RequestTypeEnum,
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .optional(),
        requestData:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        attachments:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .array(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
                'z'
              ]
                .string()
                .uuid()
            )
            .optional(),
      });
    const approveEquipmentRequestSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        requestId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        action:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].enum(['approve', 'reject']),
        rejectionReason:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
      });
    const isEquipmentRequest = (value) => {
      try {
        return equipmentRequestSchema.parse(value) !== null;
      } catch {
        return false;
      }
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/equipment-attachment.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'AttachmentTypeEnum',
      () => AttachmentTypeEnum,
      'createEquipmentAttachmentSchema',
      () => createEquipmentAttachmentSchema,
      'equipmentAttachmentSchema',
      () => equipmentAttachmentSchema,
      'isEquipmentAttachment',
      () => isEquipmentAttachment,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    const AttachmentTypeEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['inspection_report', 'history_card', 'other']);
    const equipmentAttachmentSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .int()
          .positive(),
        uuid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .nullable()
            .optional(),
        requestId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .nullable()
            .optional(),
        attachmentType: AttachmentTypeEnum,
        fileName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(255),
        originalFileName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(255),
        filePath:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        fileSize:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive(),
        mimeType:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(100),
        description:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .nullable()
            .optional(),
        uploadedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        updatedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
      });
    const createEquipmentAttachmentSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .optional(),
        requestId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .optional(),
        attachmentType: AttachmentTypeEnum,
        fileName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(255),
        originalFileName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(255),
        filePath:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        fileSize:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive()
            .max(10 * 1024 * 1024),
        mimeType:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(100),
        description:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
      });
    const isEquipmentAttachment = (value) => {
      try {
        return equipmentAttachmentSchema.parse(value) !== null;
      } catch {
        return false;
      }
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/equipment-history.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'createIncidentHistorySchema',
      () => createIncidentHistorySchema,
      'createLocationHistorySchema',
      () => createLocationHistorySchema,
      'createMaintenanceHistorySchema',
      () => createMaintenanceHistorySchema,
      'incidentHistorySchema',
      () => incidentHistorySchema,
      'locationHistorySchema',
      () => locationHistorySchema,
      'maintenanceHistorySchema',
      () => maintenanceHistorySchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    const locationHistorySchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        changedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        newLocation:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(100),
        notes:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        changedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
      });
    const createLocationHistorySchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        changedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        newLocation:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .min(1)
            .max(100),
        notes:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
      });
    const maintenanceHistorySchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        performedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        content:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        performedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        performedByName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
      });
    const createMaintenanceHistorySchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        performedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        content:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .min(1),
      });
    const incidentHistorySchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        occurredAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        incidentType:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'IncidentTypeEnum'
          ],
        content:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        reportedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        reportedByName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
      });
    const createIncidentHistorySchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        occurredAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].coerce.date(),
        incidentType:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'IncidentTypeEnum'
          ],
        content:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .min(1),
      });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/user.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'baseUserSchema',
      () => baseUserSchema,
      'createUserSchema',
      () => createUserSchema,
      'isUser',
      () => isUser,
      'updateUserSchema',
      () => updateUserSchema,
      'userListResponseSchema',
      () => userListResponseSchema,
      'userProfileSchema',
      () => userProfileSchema,
      'userSchema',
      () => userSchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/common/base.ts [app-client] (ecmascript)'
      );
    const baseUserSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        email:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .email(),
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .min(1)
          .max(100),
        role: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'UserRoleEnum'
        ],
        teamId:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'TeamIdSchema'
          ],
        site: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SiteEnum'
        ].optional(),
        location:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(50)
            .optional(),
        department:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(100)
            .optional(),
        position:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(100)
            .optional(),
        phoneNumber:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(20)
            .optional(),
        employeeId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(50)
            .optional(),
        managerName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(100)
            .optional(),
      });
    const createUserSchema = baseUserSchema.extend({
      password:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .min(8)
          .max(100),
      isActive:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .boolean()
          .default(true),
    });
    const updateUserSchema = baseUserSchema.partial().extend({
      password:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .min(8)
          .max(100)
          .optional(),
      isActive:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .boolean()
          .optional(),
    });
    const userSchema = baseUserSchema.extend({
      id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ]
        .string()
        .uuid(),
      isActive:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].boolean(),
      lastLogin:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .date()
          .nullable(),
      equipmentCount:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .nonnegative()
          .optional(),
      rentalsCount:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .nonnegative()
          .optional(),
      createdAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].date(),
      updatedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].date(),
      deletedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .date()
          .nullable(),
    });
    const userListResponseSchema = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'PaginatedResponse'
    ])(userSchema);
    const userProfileSchema = baseUserSchema.extend({
      id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ]
        .string()
        .uuid(),
      teamName:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .optional(),
      isActive:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].boolean(),
      lastLogin:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce
          .date()
          .nullable()
          .optional(),
    });
    const isUser = (value) => {
      try {
        return userSchema.parse(value) !== null;
      } catch {
        return false;
      }
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/team.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'baseTeamSchema',
      () => baseTeamSchema,
      'createTeamSchema',
      () => createTeamSchema,
      'isTeam',
      () => isTeam,
      'teamListResponseSchema',
      () => teamListResponseSchema,
      'teamSchema',
      () => teamSchema,
      'updateTeamSchema',
      () => updateTeamSchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/common/base.ts [app-client] (ecmascript)'
      );
    const baseTeamSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .min(1)
          .max(100),
        classification:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ClassificationEnum'
          ],
        site: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SiteEnum'
        ],
        classificationCode:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ClassificationCodeEnum'
          ].optional(),
        description:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(500)
            .optional(),
        leaderId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
      });
    const createTeamSchema = baseTeamSchema;
    const updateTeamSchema = baseTeamSchema.partial();
    const teamSchema = baseTeamSchema.extend({
      id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ]
        .string()
        .uuid(),
      equipmentCount:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .nonnegative()
          .optional(),
      memberCount:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .nonnegative()
          .optional(),
      createdAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce.date(),
      updatedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce.date(),
      deletedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].coerce
          .date()
          .nullable()
          .optional(),
    });
    const teamListResponseSchema = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'PaginatedResponse'
    ])(teamSchema);
    const isTeam = (value) => {
      try {
        return teamSchema.parse(value) !== null;
      } catch {
        return false;
      }
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/checkout.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'CheckoutEquipmentSchema',
      () => CheckoutEquipmentSchema,
      'CheckoutSchema',
      () => CheckoutSchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    const CheckoutSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        userId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        approverId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        destinationName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        destinationAddress:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        destinationContact:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        purpose:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutPurposeEnum'
          ],
        startDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .or(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
                'z'
              ].date()
            ),
        expectedEndDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .or(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
                'z'
              ].date()
            ),
        actualEndDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .or(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
                'z'
              ].date()
            )
            .optional(),
        notes:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        status:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CheckoutStatusEnum'
          ],
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
        updatedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
      });
    const CheckoutEquipmentSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        checkoutId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        condition:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        notes:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        createdAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
        updatedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
      });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/calibration.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'CALIBRATION_STATUS_VALUES',
      () => CALIBRATION_STATUS_VALUES,
      'CalibrationStatusEnum',
      () => CalibrationStatusEnum,
      'baseCalibrationSchema',
      () => baseCalibrationSchema,
      'calibrationListResponseSchema',
      () => calibrationListResponseSchema,
      'calibrationSchema',
      () => calibrationSchema,
      'createCalibrationSchema',
      () => createCalibrationSchema,
      'isCalibration',
      () => isCalibration,
      'updateCalibrationSchema',
      () => updateCalibrationSchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/common/base.ts [app-client] (ecmascript)'
      );
    const CalibrationStatusEnum =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].enum(['scheduled', 'in_progress', 'completed', 'failed', 'cancelled']);
    const CALIBRATION_STATUS_VALUES = CalibrationStatusEnum.options;
    const baseCalibrationSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        calibrationManagerId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        calibrationDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
        nextCalibrationDate:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].date(),
        calibrationMethod:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'CalibrationMethodEnum'
          ],
        status: CalibrationStatusEnum,
        calibrationAgency:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        certificateNumber:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        certificateFile:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        notes:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        results:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        cost: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .number()
          .optional(),
      });
    const createCalibrationSchema = baseCalibrationSchema;
    const updateCalibrationSchema = baseCalibrationSchema.partial();
    const calibrationSchema = baseCalibrationSchema.extend({
      id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ]
        .string()
        .uuid(),
      createdAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].date(),
      updatedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].date(),
      deletedAt:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .date()
          .nullable(),
    });
    const calibrationListResponseSchema = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$common$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'PaginatedResponse'
    ])(calibrationSchema);
    const isCalibration = (value) => {
      try {
        return calibrationSchema.parse(value) !== null;
      } catch {
        return false;
      }
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/types/disposal.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'DisposalAttachmentSchema',
      () => DisposalAttachmentSchema,
      'DisposalRequestSchema',
      () => DisposalRequestSchema,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    const DisposalAttachmentSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        filename:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        url: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].string(),
        uploadedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .datetime(),
      });
    const DisposalRequestSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ]
          .string()
          .uuid(),
        equipmentId:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        reason:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'DisposalReasonEnum'
          ],
        reasonDetail:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .min(10, '10자 이상 입력해주세요'),
        attachments:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .array(DisposalAttachmentSchema)
            .optional(),
        requestedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid(),
        requestedByName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        requestedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .datetime(),
        reviewStatus:
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'DisposalReviewStatusEnum'
          ],
        reviewedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        reviewedByName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        reviewedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .datetime()
            .optional(),
        reviewOpinion:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        approvedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        approvedByName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        approvedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .datetime()
            .optional(),
        approvalComment:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        rejectedBy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .uuid()
            .optional(),
        rejectedByName:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        rejectedAt:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .datetime()
            .optional(),
        rejectionReason:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .optional(),
        rejectionStep:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .enum(['review', 'approval'])
            .optional(),
        version:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .positive(),
      });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/settings.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'CALIBRATION_ALERT_DAYS_OPTIONS',
      () => CALIBRATION_ALERT_DAYS_OPTIONS,
      'DATE_FORMAT_OPTIONS',
      () => DATE_FORMAT_OPTIONS,
      'DEFAULT_CALIBRATION_ALERT_DAYS',
      () => DEFAULT_CALIBRATION_ALERT_DAYS,
      'DEFAULT_DISPLAY_PREFERENCES',
      () => DEFAULT_DISPLAY_PREFERENCES,
      'DEFAULT_LOCALE',
      () => DEFAULT_LOCALE,
      'DEFAULT_SYSTEM_SETTINGS',
      () => DEFAULT_SYSTEM_SETTINGS,
      'EQUIPMENT_SORT_OPTIONS',
      () => EQUIPMENT_SORT_OPTIONS,
      'ITEMS_PER_PAGE_OPTIONS',
      () => ITEMS_PER_PAGE_OPTIONS,
      'SUPPORTED_LOCALES',
      () => SUPPORTED_LOCALES,
      'displayPreferencesSchema',
      () => displayPreferencesSchema,
      'systemSettingsSchema',
      () => systemSettingsSchema,
    ]);
    /**
     * ============================================================================
     * SSOT: Settings 타입 & 기본값 (Single Source of Truth)
     * ============================================================================
     *
     * 이 파일은 시스템 설정, 표시 설정, 교정 알림 설정의 유일한 소스입니다.
     * 백엔드 DTO와 프론트엔드 폼에서 이 파일의 타입/기본값을 import합니다.
     *
     * 사용처:
     * - Backend: settings.service.ts, system-settings.dto.ts, calibration-settings.dto.ts
     * - Backend: user-preferences.dto.ts
     * - Frontend: SystemSettingsContent.tsx, DisplayPreferencesContent.tsx
     *
     * ============================================================================
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    const SUPPORTED_LOCALES = ['ko', 'en'];
    const DEFAULT_LOCALE = 'ko';
    const systemSettingsSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        auditLogRetentionDays:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .min(0)
            .max(9999),
        notificationRetentionDays:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .min(30)
            .max(365),
        notificationHighGraceDays:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .min(0)
            .max(365),
        notificationMediumUnreadGraceDays:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .number()
            .int()
            .min(0)
            .max(180),
        maintenanceMessage:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .max(500),
      });
    const DEFAULT_SYSTEM_SETTINGS = {
      auditLogRetentionDays: 0,
      notificationRetentionDays: 90,
      notificationHighGraceDays: 90,
      notificationMediumUnreadGraceDays: 30,
      maintenanceMessage: '',
    };
    const ITEMS_PER_PAGE_OPTIONS = ['10', '20', '50'];
    const DATE_FORMAT_OPTIONS = ['YYYY-MM-DD', 'YYYY.MM.DD'];
    const EQUIPMENT_SORT_OPTIONS = ['managementNumber', 'name', 'updatedAt'];
    const displayPreferencesSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        locale:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].enum(SUPPORTED_LOCALES),
        itemsPerPage:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].enum(ITEMS_PER_PAGE_OPTIONS),
        dateFormat:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].enum(DATE_FORMAT_OPTIONS),
        defaultEquipmentSort:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].enum(EQUIPMENT_SORT_OPTIONS),
        showRetiredEquipment:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].boolean(),
      });
    const DEFAULT_DISPLAY_PREFERENCES = {
      locale: 'ko',
      itemsPerPage: '20',
      dateFormat: 'YYYY-MM-DD',
      defaultEquipmentSort: 'managementNumber',
      showRetiredEquipment: false,
    };
    const DEFAULT_CALIBRATION_ALERT_DAYS = [30, 7, 1, 0];
    const CALIBRATION_ALERT_DAYS_OPTIONS = [0, 1, 3, 7, 14, 30, 60, 90];
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/audit-log.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'AUDIT_ACTION_COLORS',
      () => AUDIT_ACTION_COLORS,
      'AUDIT_ACTION_LABELS',
      () => AUDIT_ACTION_LABELS,
      'AUDIT_ENTITY_TYPE_LABELS',
      () => AUDIT_ENTITY_TYPE_LABELS,
      'AUDIT_TO_ACTIVITY_TYPE',
      () => AUDIT_TO_ACTIVITY_TYPE,
      'RENTAL_ACTIVITY_TYPE_OVERRIDES',
      () => RENTAL_ACTIVITY_TYPE_OVERRIDES,
      'SYSTEM_USER_UUID',
      () => SYSTEM_USER_UUID,
    ]);
    const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';
    const AUDIT_ACTION_LABELS = {
      create: '생성',
      update: '수정',
      delete: '삭제',
      approve: '승인',
      reject: '반려',
      checkout: '반출',
      return: '반입',
      cancel: '취소',
      login: '로그인',
      logout: '로그아웃',
      close: '종료',
      reject_correction: '조치 반려',
    };
    const AUDIT_ACTION_COLORS = {
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-orange-100 text-orange-800',
      checkout: 'bg-purple-100 text-purple-800',
      return: 'bg-cyan-100 text-cyan-800',
      cancel: 'bg-gray-100 text-gray-800',
      login: 'bg-indigo-100 text-indigo-800',
      logout: 'bg-slate-100 text-slate-800',
      close: 'bg-teal-100 text-teal-800',
      reject_correction: 'bg-rose-100 text-rose-800',
    };
    const AUDIT_ENTITY_TYPE_LABELS = {
      equipment: '장비',
      calibration: '교정',
      checkout: '반출',
      rental: '대여',
      rental_import: '대여 반입',
      user: '사용자',
      team: '팀',
      calibration_factor: '보정계수',
      non_conformance: '부적합',
      software: '소프트웨어',
      calibration_plan: '교정계획서',
      repair_history: '수리이력',
      equipment_import: '장비 반입',
      location_history: '위치 이력',
      maintenance_history: '유지보수 이력',
      incident_history: '사고 이력',
      settings: '설정',
    };
    const AUDIT_TO_ACTIVITY_TYPE = {
      // Equipment
      'create:equipment': 'equipment_added',
      'update:equipment': 'equipment_updated',
      'approve:equipment': 'equipment_approved',
      'reject:equipment': 'equipment_rejected',
      // Calibration
      'create:calibration': 'calibration_created',
      'update:calibration': 'calibration_updated',
      'approve:calibration': 'calibration_approved',
      // Checkout (purpose='calibration' or 'repair')
      'create:checkout': 'checkout_created',
      'approve:checkout': 'checkout_approved',
      'reject:checkout': 'checkout_rejected',
      // Non-conformance
      'create:non_conformance': 'non_conformance_created',
      'update:non_conformance': 'non_conformance_updated',
      'approve:non_conformance': 'non_conformance_resolved',
      // Calibration Plan
      'create:calibration_plan': 'calibration_plan_created',
      'approve:calibration_plan': 'calibration_plan_approved',
      'reject:calibration_plan': 'calibration_plan_rejected',
    };
    const RENTAL_ACTIVITY_TYPE_OVERRIDES = {
      checkout_created: 'rental_created',
      checkout_approved: 'rental_approved',
      checkout_rejected: 'rental_rejected',
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/field-labels.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * ⚠️ SINGLE SOURCE OF TRUTH: 엔티티별 필드명 한글 매핑
     *
     * DiffViewer 등에서 사용하는 필드명 한글 라벨입니다.
     * - 하드코딩 금지 (각 컴포넌트에서 중복 정의하지 말 것)
     * - getFieldLabel(entityType, fieldName) 헬퍼 함수 사용
     *
     * @see packages/schemas/src/audit-log.ts (AuditEntityType)
     */ /**
     * 엔티티별 필드명 한글 매핑
     */ __turbopack_context__.s([
      'FIELD_LABELS',
      () => FIELD_LABELS,
      'getAllFieldLabels',
      () => getAllFieldLabels,
      'getFieldLabel',
      () => getFieldLabel,
      'getFieldLabels',
      () => getFieldLabels,
    ]);
    const FIELD_LABELS = {
      // 장비 (equipment)
      equipment: {
        name: '장비명',
        managementNumber: '관리번호',
        modelNumber: '모델번호',
        manufacturer: '제조사',
        serial: '시리얼번호',
        classification: '분류',
        site: '사이트',
        team: '팀',
        teamId: '팀',
        status: '상태',
        location: '위치',
        building: '건물',
        room: '호실',
        calibrationMethod: '교정 방법',
        calibrationDate: '교정일',
        nextCalibrationDate: '차기 교정일',
        calibrationCycle: '교정 주기',
        purchaseDate: '구매일',
        purchasePrice: '구매 가격',
        assetNumber: '자산번호',
        notes: '비고',
        registeredBy: '등록자',
        registeredByName: '등록자',
      },
      // 교정 (calibration)
      calibration: {
        equipmentId: '장비',
        equipmentName: '장비명',
        calibrationDate: '교정일',
        nextCalibrationDate: '차기 교정일',
        result: '교정 결과',
        approvalStatus: '승인 상태',
        approvedBy: '승인자',
        approverComment: '승인자 코멘트',
        rejectedBy: '반려자',
        rejectReason: '반려 사유',
        performedBy: '교정 수행자',
        externalAgency: '외부 기관',
        certificateNumber: '성적서 번호',
        notes: '비고',
      },
      // 반출 (checkout)
      checkout: {
        equipmentId: '장비',
        equipmentName: '장비명',
        type: '반출 유형',
        purpose: '반출 목적',
        status: '상태',
        requestedBy: '요청자',
        requestedByName: '요청자',
        approvedBy: '승인자',
        approvedByName: '승인자',
        approvedAt: '승인 시각',
        rejectedBy: '반려자',
        rejectionReason: '반려 사유',
        checkoutDate: '반출 시작일',
        expectedReturnDate: '반입 예정일',
        actualReturnDate: '실제 반입일',
        destination: '반출 목적지',
        notes: '비고',
      },
      // 교정계획서 (calibration_plan)
      calibration_plan: {
        year: '연도',
        version: '버전',
        status: '상태',
        submittedAt: '제출 시각',
        reviewedBy: '검토자',
        reviewedByName: '검토자',
        reviewedAt: '검토 시각',
        reviewComment: '검토 의견',
        approvedBy: '승인자',
        approvedByName: '승인자',
        approvedAt: '승인 시각',
        rejectedBy: '반려자',
        rejectionReason: '반려 사유',
        rejectionStage: '반려 단계',
      },
      // 부적합 (non_conformance)
      non_conformance: {
        equipmentId: '장비',
        equipmentName: '장비명',
        status: '상태',
        category: '분류',
        description: '내용',
        discoveredBy: '발견자',
        discoveredByName: '발견자',
        discoveredAt: '발견 시각',
        rootCause: '근본 원인',
        correctiveAction: '시정 조치',
        preventiveAction: '예방 조치',
        closedBy: '종료자',
        closedByName: '종료자',
        closedAt: '종료 시각',
        closureNotes: '종료 비고',
        rejectedBy: '반려자',
        rejectionReason: '반려 사유',
      },
      // 폐기 (disposal_requests)
      disposal: {
        equipmentId: '장비',
        equipmentName: '장비명',
        reason: '폐기 사유',
        reasonDetail: '상세 사유',
        reviewStatus: '검토 상태',
        requestedBy: '요청자',
        requestedByName: '요청자',
        requestedAt: '요청 시각',
        reviewedBy: '검토자',
        reviewedByName: '검토자',
        reviewedAt: '검토 시각',
        reviewOpinion: '검토 의견',
        approvedBy: '승인자',
        approvedByName: '승인자',
        approvedAt: '승인 시각',
        approvalComment: '승인 의견',
        rejectedBy: '반려자',
        rejectionReason: '반려 사유',
        rejectionStep: '반려 단계',
      },
      // 사용자 (user)
      user: {
        name: '이름',
        email: '이메일',
        role: '역할',
        site: '사이트',
        teamId: '팀',
        teamName: '팀명',
        isActive: '활성 상태',
      },
      // 팀 (team)
      team: {
        name: '팀명',
        site: '사이트',
        classification: '분류',
        leaderId: '팀장',
        leaderName: '팀장',
      },
      // 소프트웨어 (software)
      software: {
        equipmentId: '장비',
        name: '소프트웨어명',
        version: '버전',
        installedDate: '설치일',
        licenseKey: '라이선스 키',
        expiryDate: '만료일',
        vendor: '제공업체',
        notes: '비고',
      },
      // 보정계수 (calibration_factor)
      calibration_factor: {
        equipmentId: '장비',
        frequency: '주파수',
        factor: '보정계수',
        unit: '단위',
        effectiveDate: '적용일',
        notes: '비고',
      },
    };
    function getFieldLabel(entityType, fieldName) {
      const entityLabels = FIELD_LABELS[entityType];
      if (!entityLabels) {
        return fieldName; // 엔티티 타입 라벨이 없으면 원본 반환
      }
      return entityLabels[fieldName] || fieldName; // 필드 라벨이 없으면 원본 반환
    }
    function getFieldLabels(entityType, fields) {
      return fields.map((field) => getFieldLabel(entityType, field));
    }
    function getAllFieldLabels(entityType) {
      return FIELD_LABELS[entityType];
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/errors.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'AppError',
      () => AppError,
      'ErrorCode',
      () => ErrorCode,
      'ErrorResponseSchema',
      () => ErrorResponseSchema,
      'errorCodeToStatusCode',
      () => errorCodeToStatusCode,
      'handleZodError',
      () => handleZodError,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    var ErrorCode = /*#__PURE__*/ (function (ErrorCode) {
      // ============================================================================
      // 일반 HTTP 에러
      // ============================================================================
      ErrorCode['BadRequest'] = 'BAD_REQUEST';
      ErrorCode['Unauthorized'] = 'UNAUTHORIZED';
      ErrorCode['Forbidden'] = 'FORBIDDEN';
      ErrorCode['NotFound'] = 'NOT_FOUND';
      ErrorCode['Conflict'] = 'CONFLICT';
      ErrorCode['TooManyRequests'] = 'TOO_MANY_REQUESTS';
      ErrorCode['InternalServerError'] = 'INTERNAL_SERVER_ERROR';
      // ============================================================================
      // 장비 관련 에러
      // ============================================================================
      ErrorCode['EquipmentNotAvailable'] = 'EQUIPMENT_NOT_AVAILABLE';
      ErrorCode['EquipmentAlreadyAssigned'] = 'EQUIPMENT_ALREADY_ASSIGNED';
      ErrorCode['EquipmentMaintenance'] = 'EQUIPMENT_MAINTENANCE';
      ErrorCode['EquipmentNotFound'] = 'EQUIPMENT_NOT_FOUND';
      ErrorCode['DuplicateManagementNumber'] = 'DUPLICATE_MANAGEMENT_NUMBER';
      ErrorCode['DuplicateSerialNumber'] = 'DUPLICATE_SERIAL_NUMBER';
      // ============================================================================
      // 사용자/인증 관련 에러
      // ============================================================================
      ErrorCode['InvalidCredentials'] = 'INVALID_CREDENTIALS';
      ErrorCode['UserNotFound'] = 'USER_NOT_FOUND';
      ErrorCode['EmailAlreadyExists'] = 'EMAIL_ALREADY_EXISTS';
      ErrorCode['SessionExpired'] = 'SESSION_EXPIRED';
      ErrorCode['PermissionDenied'] = 'PERMISSION_DENIED';
      // ============================================================================
      // 데이터 유효성 에러
      // ============================================================================
      ErrorCode['InvalidData'] = 'INVALID_DATA';
      ErrorCode['ValidationError'] = 'VALIDATION_ERROR';
      ErrorCode['RequiredFieldMissing'] = 'REQUIRED_FIELD_MISSING';
      ErrorCode['InvalidFormat'] = 'INVALID_FORMAT';
      ErrorCode['InvalidDate'] = 'INVALID_DATE';
      // ============================================================================
      // 파일 관련 에러
      // ============================================================================
      ErrorCode['FileTooLarge'] = 'FILE_TOO_LARGE';
      ErrorCode['InvalidFileType'] = 'INVALID_FILE_TYPE';
      ErrorCode['FileUploadFailed'] = 'FILE_UPLOAD_FAILED';
      // ============================================================================
      // 비즈니스 로직 에러
      // ============================================================================
      ErrorCode['CheckoutAlreadyApproved'] = 'CHECKOUT_ALREADY_APPROVED';
      ErrorCode['CheckoutNotPending'] = 'CHECKOUT_NOT_PENDING';
      ErrorCode['CalibrationOverdue'] = 'CALIBRATION_OVERDUE';
      ErrorCode['NonConformanceNotOpen'] = 'NON_CONFORMANCE_NOT_OPEN';
      ErrorCode['CannotSelfApprove'] = 'CANNOT_SELF_APPROVE';
      // ============================================================================
      // 스코프/접근 범위 에러
      // ============================================================================
      ErrorCode['ScopeAccessDenied'] = 'SCOPE_ACCESS_DENIED';
      // ============================================================================
      // 네트워크/시스템 에러
      // ============================================================================
      ErrorCode['NetworkError'] = 'NETWORK_ERROR';
      ErrorCode['TimeoutError'] = 'TIMEOUT_ERROR';
      ErrorCode['ServiceUnavailable'] = 'SERVICE_UNAVAILABLE';
      return ErrorCode;
    })({});
    const errorCodeToStatusCode = {
      // 일반 HTTP 에러
      ['BAD_REQUEST']: 400,
      ['UNAUTHORIZED']: 401,
      ['FORBIDDEN']: 403,
      ['NOT_FOUND']: 404,
      ['CONFLICT']: 409,
      ['TOO_MANY_REQUESTS']: 429,
      ['INTERNAL_SERVER_ERROR']: 500,
      // 장비 관련 에러
      ['EQUIPMENT_NOT_AVAILABLE']: 400,
      ['EQUIPMENT_ALREADY_ASSIGNED']: 409,
      ['EQUIPMENT_MAINTENANCE']: 400,
      ['EQUIPMENT_NOT_FOUND']: 404,
      ['DUPLICATE_MANAGEMENT_NUMBER']: 409,
      ['DUPLICATE_SERIAL_NUMBER']: 409,
      // 사용자/인증 관련 에러
      ['INVALID_CREDENTIALS']: 401,
      ['USER_NOT_FOUND']: 404,
      ['EMAIL_ALREADY_EXISTS']: 409,
      ['SESSION_EXPIRED']: 401,
      ['PERMISSION_DENIED']: 403,
      // 데이터 유효성 에러
      ['INVALID_DATA']: 400,
      ['VALIDATION_ERROR']: 400,
      ['REQUIRED_FIELD_MISSING']: 400,
      ['INVALID_FORMAT']: 400,
      ['INVALID_DATE']: 400,
      // 파일 관련 에러
      ['FILE_TOO_LARGE']: 413,
      ['INVALID_FILE_TYPE']: 415,
      ['FILE_UPLOAD_FAILED']: 500,
      // 비즈니스 로직 에러
      ['CHECKOUT_ALREADY_APPROVED']: 409,
      ['CHECKOUT_NOT_PENDING']: 400,
      ['CALIBRATION_OVERDUE']: 400,
      ['NON_CONFORMANCE_NOT_OPEN']: 400,
      ['CANNOT_SELF_APPROVE']: 403,
      // 스코프/접근 범위 에러
      ['SCOPE_ACCESS_DENIED']: 403,
      // 네트워크/시스템 에러
      ['NETWORK_ERROR']: 503,
      ['TIMEOUT_ERROR']: 504,
      ['SERVICE_UNAVAILABLE']: 503,
    };
    const ErrorResponseSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
          'z'
        ].nativeEnum(ErrorCode),
        message:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].string(),
        details:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .unknown()
            .optional(),
        timestamp:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ]
            .string()
            .datetime(),
      });
    class AppError extends Error {
      code;
      details;
      statusCode;
      constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.statusCode = errorCodeToStatusCode[code];
        this.name = 'AppError';
        // 스택 트레이스 유지를 위한 설정
        // V8 엔진 전용 API (Node.js)
        const ErrorConstructor = Error;
        if (ErrorConstructor.captureStackTrace) {
          ErrorConstructor.captureStackTrace(this, AppError);
        }
      }
      // 응답 형식으로 변환
      toResponse() {
        return {
          code: this.code,
          message: this.message,
          details: this.details,
          timestamp: new Date().toISOString(),
        };
      }
      // 특정 에러 타입 생성을 위한 팩토리 메서드들
      static badRequest(message, details) {
        return new AppError('BAD_REQUEST', message, details);
      }
      static unauthorized(message = '인증이 필요합니다', details) {
        return new AppError('UNAUTHORIZED', message, details);
      }
      static forbidden(message = '권한이 없습니다', details) {
        return new AppError('FORBIDDEN', message, details);
      }
      static notFound(message = '리소스를 찾을 수 없습니다', details) {
        return new AppError('NOT_FOUND', message, details);
      }
      static conflict(message, details) {
        return new AppError('CONFLICT', message, details);
      }
      static internalServerError(message = '서버 오류가 발생했습니다', details) {
        return new AppError('INTERNAL_SERVER_ERROR', message, details);
      }
      static validationError(message = '유효성 검사 오류', details) {
        return new AppError('VALIDATION_ERROR', message, details);
      }
    }
    function handleZodError(error) {
      return AppError.validationError('입력 데이터가 유효하지 않습니다', {
        issues: error.format(),
      });
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/api-response.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'createPaginatedResponseSchema',
      () => createPaginatedResponseSchema,
      'paginationMetaSchema',
      () => paginationMetaSchema,
    ]);
    /**
     * API 응답 구조 표준 정의
     *
     * ✅ Single Source of Truth: 모든 API 응답 타입은 여기서 정의
     * ✅ 백엔드와 프론트엔드 간 일관성 보장
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>'
      );
    const paginationMetaSchema =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        totalItems:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].number(),
        itemCount:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].number(),
        itemsPerPage:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].number(),
        totalPages:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].number(),
        currentPage:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].number(),
      });
    function createPaginatedResponseSchema(itemSchema) {
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
        'z'
      ].object({
        items:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__[
            'z'
          ].array(itemSchema),
        meta: paginationMetaSchema,
      });
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([]);
    /**
     * @equipment-management/schemas
     *
     * 공유 타입, Zod 스키마, enum 정의의 Single Source of Truth
     *
     * Best Practice: 각 모듈별 `export * from` 패턴으로 자동 동기화
     */ // ============================================================
    // Core Domain Schemas
    // ============================================================
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$equipment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/equipment.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$equipment$2d$request$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/equipment-request.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$equipment$2d$attachment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/equipment-attachment.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$equipment$2d$history$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/equipment-history.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$user$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/user.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$team$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/team.ts [app-client] (ecmascript)');
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$checkout$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/checkout.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$calibration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/calibration.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$types$2f$disposal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/types/disposal.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$settings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/settings.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$audit$2d$log$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/audit-log.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$field$2d$labels$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/field-labels.ts [app-client] (ecmascript)'
      );
    // ============================================================
    // Enums - Single Source of Truth
    // ============================================================
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    // ============================================================
    // Error Handling
    // ============================================================
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/errors.ts [app-client] (ecmascript)');
    // ============================================================
    // API Response Types
    // ============================================================
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$api$2d$response$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/api-response.ts [app-client] (ecmascript)'
      );
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/errors/equipment-errors.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'ApiError',
      () => ApiError,
      'ERROR_MESSAGES',
      () => ERROR_MESSAGES,
      'EquipmentErrorCode',
      () => EquipmentErrorCode,
      'getLocalizedErrorInfo',
      () => getLocalizedErrorInfo,
      'httpStatusToErrorCode',
      () => httpStatusToErrorCode,
      'isAuthError',
      () => isAuthError,
      'isConflictError',
      () => isConflictError,
      'isRetryableError',
      () => isRetryableError,
      'mapBackendErrorCode',
      () => mapBackendErrorCode,
    ]);
    /**
     * 장비 관리 시스템 에러 정의
     *
     * ⚠️ SSOT 관계:
     * - @equipment-management/schemas의 ErrorCode: 백엔드/API 레벨 에러 코드
     * - EquipmentErrorCode: 프론트엔드 UI 레벨 에러 코드 (더 세분화된 분류)
     *
     * 에러 코드, 메시지, 해결 방법을 정의합니다.
     */ // schemas ErrorCode를 re-export하여 프론트엔드에서도 사용 가능하게 함
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var EquipmentErrorCode = /*#__PURE__*/ (function (EquipmentErrorCode) {
      // 검증 에러
      EquipmentErrorCode['VALIDATION_ERROR'] = 'VALIDATION_ERROR';
      EquipmentErrorCode['REQUIRED_FIELD_MISSING'] = 'REQUIRED_FIELD_MISSING';
      EquipmentErrorCode['INVALID_FORMAT'] = 'INVALID_FORMAT';
      EquipmentErrorCode['INVALID_DATE'] = 'INVALID_DATE';
      // 중복 에러
      EquipmentErrorCode['DUPLICATE_ERROR'] = 'DUPLICATE_ERROR';
      EquipmentErrorCode['DUPLICATE_MANAGEMENT_NUMBER'] = 'DUPLICATE_MANAGEMENT_NUMBER';
      EquipmentErrorCode['DUPLICATE_SERIAL_NUMBER'] = 'DUPLICATE_SERIAL_NUMBER';
      // 동시성 에러 (CAS / Optimistic Locking)
      EquipmentErrorCode['VERSION_CONFLICT'] = 'VERSION_CONFLICT';
      // 권한 에러
      EquipmentErrorCode['UNAUTHORIZED'] = 'UNAUTHORIZED';
      EquipmentErrorCode['PERMISSION_DENIED'] = 'PERMISSION_DENIED';
      EquipmentErrorCode['SCOPE_ACCESS_DENIED'] = 'SCOPE_ACCESS_DENIED';
      EquipmentErrorCode['SESSION_EXPIRED'] = 'SESSION_EXPIRED';
      // 리소스 에러
      EquipmentErrorCode['NOT_FOUND'] = 'NOT_FOUND';
      EquipmentErrorCode['EQUIPMENT_NOT_FOUND'] = 'EQUIPMENT_NOT_FOUND';
      // 서버/네트워크 에러
      EquipmentErrorCode['SERVER_ERROR'] = 'SERVER_ERROR';
      EquipmentErrorCode['NETWORK_ERROR'] = 'NETWORK_ERROR';
      EquipmentErrorCode['TIMEOUT_ERROR'] = 'TIMEOUT_ERROR';
      // 파일 에러
      EquipmentErrorCode['FILE_TOO_LARGE'] = 'FILE_TOO_LARGE';
      EquipmentErrorCode['INVALID_FILE_TYPE'] = 'INVALID_FILE_TYPE';
      EquipmentErrorCode['FILE_UPLOAD_FAILED'] = 'FILE_UPLOAD_FAILED';
      // 이력 저장 에러
      EquipmentErrorCode['HISTORY_SAVE_FAILED'] = 'HISTORY_SAVE_FAILED';
      EquipmentErrorCode['CALIBRATION_SAVE_FAILED'] = 'CALIBRATION_SAVE_FAILED';
      EquipmentErrorCode['LOCATION_HISTORY_SAVE_FAILED'] = 'LOCATION_HISTORY_SAVE_FAILED';
      EquipmentErrorCode['MAINTENANCE_HISTORY_SAVE_FAILED'] = 'MAINTENANCE_HISTORY_SAVE_FAILED';
      EquipmentErrorCode['INCIDENT_HISTORY_SAVE_FAILED'] = 'INCIDENT_HISTORY_SAVE_FAILED';
      // 기타
      EquipmentErrorCode['UNKNOWN_ERROR'] = 'UNKNOWN_ERROR';
      return EquipmentErrorCode;
    })({});
    const ERROR_MESSAGES = {
      // 검증 에러
      ['VALIDATION_ERROR']: {
        title: '입력 값 오류',
        message: '입력 값이 올바르지 않습니다.',
        solutions: ['빨간색으로 표시된 필드를 확인하세요', '필수 항목을 모두 입력하세요'],
        severity: 'error',
      },
      ['REQUIRED_FIELD_MISSING']: {
        title: '필수 항목 누락',
        message: '필수 입력 항목이 누락되었습니다.',
        solutions: ['* 표시가 있는 필수 항목을 모두 입력하세요'],
        severity: 'error',
      },
      ['INVALID_FORMAT']: {
        title: '형식 오류',
        message: '입력 형식이 올바르지 않습니다.',
        solutions: [
          '관리번호: XXX-XYYYY 형식으로 입력하세요',
          '예: SUW-E0001 (수원), UIW-E0001 (의왕)',
        ],
        severity: 'error',
      },
      ['INVALID_DATE']: {
        title: '날짜 형식 오류',
        message: '유효하지 않은 날짜입니다.',
        solutions: ['날짜 선택기를 사용하여 올바른 날짜를 선택하세요'],
        severity: 'error',
      },
      // 중복 에러
      ['DUPLICATE_ERROR']: {
        title: '중복 오류',
        message: '이미 등록된 정보입니다.',
        solutions: ['다른 값을 사용하거나 기존 데이터를 확인하세요'],
        severity: 'error',
      },
      ['DUPLICATE_MANAGEMENT_NUMBER']: {
        title: '관리번호 중복',
        message: '이미 등록된 관리번호입니다.',
        solutions: [
          '다른 관리번호를 사용하세요',
          '기존 장비를 확인하려면 장비 목록에서 검색하세요',
        ],
        actionLabel: '장비 목록에서 검색',
        actionHref: '/equipment',
        severity: 'error',
      },
      ['DUPLICATE_SERIAL_NUMBER']: {
        title: '일련번호 중복',
        message: '이미 등록된 일련번호입니다.',
        solutions: ['다른 일련번호를 사용하세요', '기존 장비 확인을 권장합니다'],
        actionLabel: '장비 목록에서 검색',
        actionHref: '/equipment',
        severity: 'error',
      },
      ['VERSION_CONFLICT']: {
        title: '데이터 충돌',
        message: '다른 사용자가 이 데이터를 수정했습니다. 최신 데이터를 불러옵니다.',
        solutions: ['페이지가 자동으로 새로고침됩니다', '새로고침 후 다시 시도해주세요'],
        severity: 'warning',
      },
      // 권한 에러
      ['UNAUTHORIZED']: {
        title: '인증 필요',
        message: '로그인이 필요합니다.',
        solutions: ['다시 로그인하세요'],
        actionLabel: '로그인',
        actionHref: '/login',
        severity: 'error',
      },
      ['PERMISSION_DENIED']: {
        title: '권한 없음',
        message: '이 작업을 수행할 권한이 없습니다.',
        solutions: [
          '해당 사이트/팀에 대한 권한이 있는지 확인하세요',
          '권한이 필요한 경우 시스템 관리자에게 문의하세요',
        ],
        severity: 'error',
      },
      ['SCOPE_ACCESS_DENIED']: {
        title: '접근 범위 초과',
        message: '해당 사이트/팀의 리소스에 대한 접근 권한이 없습니다.',
        solutions: [
          '본인 소속 사이트/팀의 데이터만 수정할 수 있습니다.',
          '필요시 시스템 관리자에게 문의하세요.',
        ],
        severity: 'error',
      },
      ['SESSION_EXPIRED']: {
        title: '세션 만료',
        message: '로그인 세션이 만료되었습니다.',
        solutions: ['다시 로그인하세요'],
        actionLabel: '로그인',
        actionHref: '/login',
        severity: 'warning',
      },
      // 리소스 에러
      ['NOT_FOUND']: {
        title: '찾을 수 없음',
        message: '요청한 리소스를 찾을 수 없습니다.',
        solutions: ['올바른 정보인지 확인하세요', '이미 삭제되었을 수 있습니다'],
        severity: 'error',
      },
      ['EQUIPMENT_NOT_FOUND']: {
        title: '장비를 찾을 수 없음',
        message: '요청한 장비를 찾을 수 없습니다.',
        solutions: ['장비 ID가 올바른지 확인하세요', '장비가 삭제되었을 수 있습니다'],
        actionLabel: '장비 목록으로',
        actionHref: '/equipment',
        severity: 'error',
      },
      // 서버/네트워크 에러
      ['SERVER_ERROR']: {
        title: '서버 오류',
        message: '서버에서 오류가 발생했습니다.',
        solutions: ['잠시 후 다시 시도해주세요', '문제가 지속되면 시스템 관리자에게 문의하세요'],
        severity: 'error',
      },
      ['NETWORK_ERROR']: {
        title: '네트워크 오류',
        message: '서버와 연결할 수 없습니다.',
        solutions: ['인터넷 연결 상태를 확인하세요', '잠시 후 다시 시도해주세요'],
        severity: 'error',
      },
      ['TIMEOUT_ERROR']: {
        title: '요청 시간 초과',
        message: '서버 응답 시간이 초과되었습니다.',
        solutions: ['잠시 후 다시 시도해주세요'],
        severity: 'warning',
      },
      // 파일 에러
      ['FILE_TOO_LARGE']: {
        title: '파일 크기 초과',
        message: '업로드 파일 크기가 너무 큽니다.',
        solutions: ['파일 크기를 10MB 이하로 줄여주세요', 'PDF의 경우 압축하거나 분할해주세요'],
        severity: 'error',
      },
      ['INVALID_FILE_TYPE']: {
        title: '지원하지 않는 파일 형식',
        message: '업로드할 수 없는 파일 형식입니다.',
        solutions: [
          '허용된 파일 형식: PDF, JPG, PNG, GIF',
          '다른 형식의 파일은 PDF로 변환해주세요',
        ],
        severity: 'error',
      },
      ['FILE_UPLOAD_FAILED']: {
        title: '파일 업로드 실패',
        message: '파일 업로드 중 오류가 발생했습니다.',
        solutions: ['파일을 다시 선택하여 업로드해주세요', '파일 크기와 형식을 확인하세요'],
        severity: 'error',
      },
      // 이력 저장 에러
      ['HISTORY_SAVE_FAILED']: {
        title: '이력 저장 실패',
        message: '일부 이력 정보 저장에 실패했습니다.',
        solutions: [
          '장비는 등록되었지만 이력 저장에 문제가 있습니다',
          '장비 상세 페이지에서 이력을 다시 추가해주세요',
        ],
        severity: 'warning',
      },
      ['CALIBRATION_SAVE_FAILED']: {
        title: '교정 이력 저장 실패',
        message: '교정 이력 저장에 실패했습니다.',
        solutions: ['교정 관리 페이지에서 다시 등록해주세요'],
        actionLabel: '교정 관리로 이동',
        actionHref: '/calibration',
        severity: 'warning',
      },
      ['LOCATION_HISTORY_SAVE_FAILED']: {
        title: '위치 변동 이력 저장 실패',
        message: '위치 변동 이력 저장에 실패했습니다.',
        solutions: ['장비 상세 페이지에서 이력을 다시 추가해주세요'],
        severity: 'warning',
      },
      ['MAINTENANCE_HISTORY_SAVE_FAILED']: {
        title: '유지보수 내역 저장 실패',
        message: '유지보수 내역 저장에 실패했습니다.',
        solutions: ['장비 상세 페이지에서 이력을 다시 추가해주세요'],
        severity: 'warning',
      },
      ['INCIDENT_HISTORY_SAVE_FAILED']: {
        title: '손상/수리 내역 저장 실패',
        message: '손상/수리 내역 저장에 실패했습니다.',
        solutions: ['장비 상세 페이지에서 이력을 다시 추가해주세요'],
        severity: 'warning',
      },
      // 기타
      ['UNKNOWN_ERROR']: {
        title: '알 수 없는 오류',
        message: '예기치 않은 오류가 발생했습니다.',
        solutions: ['잠시 후 다시 시도해주세요', '문제가 지속되면 시스템 관리자에게 문의하세요'],
        severity: 'error',
      },
    };
    function getLocalizedErrorInfo(code, t) {
      const fallback = ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'];
      // i18n 모드: t 함수가 제공된 경우
      if (t) {
        let solutions = [];
        try {
          const rawSolutions = t.raw(`${code}.solutions`);
          solutions = Array.isArray(rawSolutions) ? rawSolutions : [];
        } catch {
          solutions = fallback.solutions;
        }
        let actionLabel;
        try {
          const raw = t.raw(`${code}.actionLabel`);
          actionLabel = typeof raw === 'string' ? raw : undefined;
        } catch {
          actionLabel = fallback.actionLabel;
        }
        return {
          title: t(`${code}.title`),
          message: t(`${code}.message`),
          solutions,
          actionLabel,
          actionHref: fallback.actionHref,
          severity: fallback.severity,
        };
      }
      // 폴백: 기존 ERROR_MESSAGES 사용
      return fallback;
    }
    class ApiError extends Error {
      code;
      statusCode;
      details;
      timestamp;
      constructor(message, code = 'UNKNOWN_ERROR', statusCode, details) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date();
      }
      /**
       * 에러 정보 조회
       */ getErrorInfo() {
        return ERROR_MESSAGES[this.code] || ERROR_MESSAGES['UNKNOWN_ERROR'];
      }
      /**
       * 사용자에게 표시할 메시지 조회
       */ getUserMessage() {
        const info = this.getErrorInfo();
        return this.message || info.message;
      }
    }
    function httpStatusToErrorCode(status) {
      switch (status) {
        case 400:
          return 'VALIDATION_ERROR';
        case 401:
          return 'UNAUTHORIZED';
        case 403:
          return 'PERMISSION_DENIED';
        case 404:
          return 'NOT_FOUND';
        case 408:
          return 'TIMEOUT_ERROR';
        case 409:
          return 'DUPLICATE_ERROR';
        case 413:
          return 'FILE_TOO_LARGE';
        case 415:
          return 'INVALID_FILE_TYPE';
        case 500:
        case 502:
        case 503:
          return 'SERVER_ERROR';
        default:
          return 'UNKNOWN_ERROR';
      }
    }
    function mapBackendErrorCode(backendCode) {
      if (!backendCode) return 'UNKNOWN_ERROR';
      // 백엔드 에러 코드 매핑 (대소문자 무시)
      const normalizedCode = backendCode.toUpperCase();
      const mappings = {
        // 중복 에러
        DUPLICATE_MANAGEMENT_NUMBER: 'DUPLICATE_MANAGEMENT_NUMBER',
        DUPLICATE_SERIAL_NUMBER: 'DUPLICATE_SERIAL_NUMBER',
        DUPLICATE_ERROR: 'DUPLICATE_ERROR',
        CONFLICT: 'DUPLICATE_ERROR',
        VERSION_CONFLICT: 'VERSION_CONFLICT',
        // 검증 에러
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        BAD_REQUEST: 'VALIDATION_ERROR',
        INVALID_INPUT: 'VALIDATION_ERROR',
        // 권한 에러
        UNAUTHORIZED: 'UNAUTHORIZED',
        FORBIDDEN: 'PERMISSION_DENIED',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        ACCESS_DENIED: 'PERMISSION_DENIED',
        SCOPE_ACCESS_DENIED: 'SCOPE_ACCESS_DENIED',
        // 리소스 에러
        NOT_FOUND: 'NOT_FOUND',
        EQUIPMENT_NOT_FOUND: 'EQUIPMENT_NOT_FOUND',
        // 파일 에러
        FILE_TOO_LARGE: 'FILE_TOO_LARGE',
        PAYLOAD_TOO_LARGE: 'FILE_TOO_LARGE',
        INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
        UNSUPPORTED_MEDIA_TYPE: 'INVALID_FILE_TYPE',
        // 서버 에러
        INTERNAL_SERVER_ERROR: 'SERVER_ERROR',
        SERVER_ERROR: 'SERVER_ERROR',
      };
      return mappings[normalizedCode] || 'UNKNOWN_ERROR';
    }
    function isRetryableError(error) {
      if (error instanceof ApiError) {
        const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'];
        return retryableCodes.includes(error.code);
      }
      return false;
    }
    function isConflictError(error) {
      if (error instanceof ApiError) {
        return (
          error.statusCode === 409 ||
          error.code === 'VERSION_CONFLICT' ||
          error.code === 'DUPLICATE_ERROR'
        );
      }
      if (typeof error === 'object' && error !== null) {
        const errorObj = error;
        if (errorObj.statusCode === 409 || errorObj.status === 409) return true;
        if (errorObj.code === 'VERSION_CONFLICT' || errorObj.code === 'CONFLICT') return true;
      }
      return false;
    }
    function isAuthError(error) {
      if (error instanceof ApiError) {
        const authCodes = ['UNAUTHORIZED', 'SESSION_EXPIRED'];
        return authCodes.includes(error.code);
      }
      return false;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * API 응답 변환 유틸리티
     *
     * ✅ Single Source of Truth: 백엔드 응답 구조를 프론트엔드에서 사용하기 편한 형태로 변환
     * ✅ 중복 제거: 모든 API 클라이언트에서 공통으로 사용
     * ✅ 타입 안전성: TypeScript 타입으로 보장
     */ __turbopack_context__.s([
      'createApiError',
      () => createApiError,
      'transformArrayResponse',
      () => transformArrayResponse,
      'transformPaginatedResponse',
      () => transformPaginatedResponse,
      'transformSingleResponse',
      () => transformSingleResponse,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/errors/equipment-errors.ts [app-client] (ecmascript) <locals>'
      );
    function transformPaginatedResponse(response) {
      // ResponseTransformInterceptor 래핑 해제: { success, data, message, timestamp }
      // 백엔드 인터셉터가 실제 데이터를 data 필드로 래핑함
      const rawData = response.data;
      const backendData =
        rawData && typeof rawData === 'object' && 'success' in rawData && 'data' in rawData
          ? rawData.data
          : rawData;
      // 백엔드 응답 구조 확인
      if (
        backendData &&
        typeof backendData === 'object' &&
        'items' in backendData &&
        'meta' in backendData
      ) {
        const paginated = backendData;
        const result = {
          data: paginated.items || [],
          meta: {
            pagination: {
              total: paginated.meta.totalItems,
              pageSize: paginated.meta.itemsPerPage,
              currentPage: paginated.meta.currentPage,
              totalPages: paginated.meta.totalPages,
            },
          },
        };
        // summary 필드가 있으면 보존 (도메인별 TSummary 타입으로 전달)
        if (paginated.summary) {
          result.meta.summary = paginated.summary;
        }
        return result;
      }
      // 레거시 호환성: 이미 변환된 형태인 경우
      if (
        backendData &&
        typeof backendData === 'object' &&
        'data' in backendData &&
        'meta' in backendData
      ) {
        return backendData;
      }
      // 기본값 반환 (에러 방지)
      return {
        data: [],
        meta: {
          pagination: {
            total: 0,
            pageSize: 20,
            currentPage: 1,
            totalPages: 0,
          },
        },
      };
    }
    function transformSingleResponse(response) {
      const backendData = response.data;
      // 백엔드가 { data: {...} } 형태로 감싸서 반환하는 경우
      if (backendData && typeof backendData === 'object' && 'data' in backendData) {
        return backendData.data;
      }
      // 백엔드가 직접 객체를 반환하는 경우
      return backendData;
    }
    function transformArrayResponse(response) {
      const backendData = response.data;
      // 배열이 직접 반환된 경우
      if (Array.isArray(backendData)) {
        return backendData;
      }
      // { data: [...] } 형태
      if (backendData && typeof backendData === 'object' && 'data' in backendData) {
        const wrapped = backendData;
        return Array.isArray(wrapped.data) ? wrapped.data : [];
      }
      // { items: [...] } 형태 (페이지네이션 없는 목록)
      if (backendData && typeof backendData === 'object' && 'items' in backendData) {
        const wrapped = backendData;
        return Array.isArray(wrapped.items) ? wrapped.items : [];
      }
      // 기본값: 빈 배열
      return [];
    }
    function createApiError(error) {
      // 이미 ApiError인 경우
      if (
        error instanceof
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ]
      ) {
        return error;
      }
      // Axios 에러 처리
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error;
        const status = axiosError.response?.status;
        const errorData = axiosError.response?.data;
        // 응답 없는 에러 (네트워크/연결 레벨 실패)
        if (!axiosError.response) {
          const code = axiosError.code;
          // 타임아웃 에러
          if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'ApiError'
            ](
              'Request timed out.',
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'EquipmentErrorCode'
              ].TIMEOUT_ERROR
            );
          }
          const networkErrorCodes = [
            'ERR_NETWORK',
            'ECONNREFUSED',
            'ECONNRESET',
            'ENOTFOUND',
            'EHOSTUNREACH',
            'ENETUNREACH',
            'EPIPE',
            'EAI_AGAIN',
          ];
          if (code && networkErrorCodes.includes(code)) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'ApiError'
            ](
              `Cannot connect to backend server (${code}).`,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'EquipmentErrorCode'
              ].NETWORK_ERROR
            );
          }
          return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'ApiError'
          ](
            `Server connection error${code ? ` (${code})` : ''}.`,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].NETWORK_ERROR
          );
        }
        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'ApiError'
          ](
            'Request timed out.',
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].TIMEOUT_ERROR
          );
        }
        if (errorData && typeof errorData === 'object') {
          // 🔴 백엔드 표준 에러 응답 구조 #1: { code, message, timestamp, details }
          // 예: { code: "UNAUTHORIZED", message: "인증에 실패했습니다.", ... }
          if ('code' in errorData && 'message' in errorData) {
            const backendError = errorData;
            const message = backendError.message || 'An unknown error occurred.';
            const errorCode =
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'mapBackendErrorCode'
              ])(backendError.code) ||
              (status
                ? (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'httpStatusToErrorCode'
                  ])(status)
                : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'EquipmentErrorCode'
                  ].UNKNOWN_ERROR);
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'ApiError'
            ](message, errorCode, status, backendError.details);
          }
          // 백엔드 표준 에러 응답 구조 #2: { error: { code, message, details }, meta: {...} }
          if ('error' in errorData) {
            const backendError = errorData;
            const message = backendError.error.message || 'An unknown error occurred.';
            const errorCode =
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'mapBackendErrorCode'
              ])(backendError.error.code) ||
              (status
                ? (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'httpStatusToErrorCode'
                  ])(status)
                : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                    'EquipmentErrorCode'
                  ].UNKNOWN_ERROR);
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'ApiError'
            ](message, errorCode, status, backendError.error.details);
          }
          // NestJS ValidationPipe 및 Zod 검증 에러 구조
          // 1. NestJS: { message: string | string[], error?: string, statusCode?: number }
          // 2. Zod: { message: string, errors: Array<{path, message, code}> }
          if ('message' in errorData) {
            const nestError = errorData;
            // 방어적 코드: message가 null/undefined/empty일 수 있음
            let message;
            let details;
            if (Array.isArray(nestError.message) && nestError.message.length > 0) {
              const filteredMessages = nestError.message.filter(
                (m) => typeof m === 'string' && m.trim().length > 0
              );
              message = filteredMessages.join(', ') || 'An unknown error occurred.';
              details = filteredMessages.length > 0 ? filteredMessages : undefined;
            } else if (nestError.message && typeof nestError.message === 'string') {
              message = String(nestError.message);
            } else {
              message = nestError.error || 'An unknown error occurred.';
            }
            // ✅ Zod 검증 에러의 상세 정보 전달
            if (nestError.errors && Array.isArray(nestError.errors)) {
              details = nestError.errors;
              // 첫 번째 에러 메시지를 주 메시지로 사용 (더 구체적)
              if (nestError.errors.length > 0 && nestError.errors[0].message) {
                message = nestError.errors[0].message;
              }
            }
            const errorCode = status
              ? (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'httpStatusToErrorCode'
                ])(status)
              : __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                  'EquipmentErrorCode'
                ].VALIDATION_ERROR;
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'ApiError'
            ](message, errorCode, status, details);
          }
        }
        // HTTP 상태 코드 기반 메시지
        // TODO(i18n): Phase 3에서 errors.json의 키(VALIDATION_ERROR, UNAUTHORIZED 등)로 전환
        // 현재는 순수 유틸리티 함수로 translation context 없음 — 호출자 레벨에서 처리 예정
        if (status) {
          const errorCode = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'httpStatusToErrorCode'
          ])(status);
          const statusMessages = {
            400: 'Bad request.',
            401: 'Authentication required. Please log in again.',
            403: 'You do not have permission to perform this action.',
            404: 'The requested resource was not found.',
            409: 'The data already exists.',
            413: 'File size is too large.',
            415: 'Unsupported file format.',
            500: 'An internal server error occurred.',
            502: 'Cannot connect to the server.',
            503: 'The server is temporarily unavailable.',
          };
          return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'ApiError'
          ](statusMessages[status] || 'An unknown error occurred.', errorCode, status);
        }
      }
      // 일반 Error 객체
      if (error instanceof Error) {
        // 네트워크 관련 에러 메시지 패턴
        if (
          error.message &&
          (error.message.includes('Network') || error.message.includes('fetch'))
        ) {
          return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'ApiError'
          ](
            'A network error occurred. Please check your internet connection.',
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'EquipmentErrorCode'
            ].NETWORK_ERROR
          );
        }
        // 🔴 방어적 코드: error.message가 없을 수 있음
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'ApiError'
        ](
          error.message || 'An unknown error occurred.',
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'EquipmentErrorCode'
          ].UNKNOWN_ERROR
        );
      }
      // 알 수 없는 에러 - 개발 모드에서 디버깅 정보 제공
      if (('TURBOPACK compile-time truthy', 1)) {
        console.error('[createApiError] Unknown error structure:', error);
      }
      return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
        'ApiError'
      ](
        'An unexpected error occurred.',
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$errors$2f$equipment$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'EquipmentErrorCode'
        ].UNKNOWN_ERROR
      );
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/config/api-config.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * API 엔드포인트 설정 (SSOT)
     *
     * 모든 프론트엔드 코드는 이 파일에서 백엔드 URL을 import합니다.
     * ❌ 금지: 파일 내부에서 직접 `process.env.NEXT_PUBLIC_API_URL` 참조
     * ✅ 허용: `import { API_BASE_URL } from '@/lib/config/api-config'`
     *
     * 환경변수:
     * - NEXT_PUBLIC_API_URL: 백엔드 호스트 (예: http://localhost:3001)
     *   - '/api' 접미사 포함 금지 — 각 API 클라이언트가 경로를 결합
     *   - 미설정 시 개발 기본값으로 폴백
     *
     * 크로스 사이트 워크플로우:
     * - 클라이언트 컴포넌트: NEXT_PUBLIC_API_URL (빌드 시 인라인)
     * - 서버 컴포넌트: 동일 변수 (서버 런타임 환경변수)
     * - NextAuth 콜백: 동일 변수 (Node.js 환경)
     */ __turbopack_context__.s(['API_BASE_URL', () => API_BASE_URL]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    const API_BASE_URL =
      ('TURBOPACK compile-time value', 'http://localhost:3001') ?? 'http://localhost:3001';
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'apiClient',
      () => apiClient,
      'clearTokenCache',
      () => clearTokenCache,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)'
      );
    // ✅ 일관된 에러 처리: 공통 유틸리티 사용
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$config$2f$api$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/config/api-config.ts [app-client] (ecmascript)'
      );
    /**
     * ============================================================================
     * 인증 토큰 관리 정책
     * ============================================================================
     *
     * ⚠️ 중요: localStorage 토큰 사용 금지
     *
     * 이 프로젝트는 NextAuth를 단일 인증 소스(Single Source of Truth)로 사용합니다.
     * - 인증 토큰은 NextAuth 세션(httpOnly 쿠키)에서만 관리
     * - localStorage.token 사용 시 NextAuth 세션과 불일치 문제 발생
     *
     * Token Refresh 아키텍처:
     *   - Access Token은 15분 수명
     *   - SessionProvider refetchInterval(4분)로 JWT 콜백이 자동 갱신
     *   - 401 발생 시 getSession()으로 최신 토큰 재조회
     *
     * 올바른 패턴:
     *   const session = await getSession();
     *   const token = session?.accessToken;
     *
     * 잘못된 패턴:
     *   localStorage.getItem('token')  // ❌ 사용 금지
     *   localStorage.setItem('token')  // ❌ 사용 금지
     *
     * 참고: docs/development/AUTH_ARCHITECTURE.md
     * ============================================================================
     */ /**
     * API 클라이언트 설정
     *
     * ⚠️ 중요: API 경로 규칙
     * - 환경변수 NEXT_PUBLIC_API_URL: 'http://localhost:3001' (호스트만, /api 미포함)
     * - 모든 API 호출 경로는 '/api/'로 시작해야 함
     *
     * ✅ 올바른 예시:
     *   apiClient.get('/api/equipment')
     *   apiClient.post('/api/calibration', data)
     *
     * ❌ 잘못된 예시:
     *   apiClient.get('/equipment')      // '/api' 접두사 누락
     *   apiClient.get('api/equipment')   // 슬래시 누락
     *
     * 이 규칙을 따르지 않으면 404 에러 또는 '/api/api/...' 중복 오류 발생
     */ // 개발 모드에서 잘못된 API 경로 감지
    const validateApiPath = (path) => {
      if (('TURBOPACK compile-time truthy', 1)) {
        // /api로 시작하지 않는 경우 경고
        if (path && !path.startsWith('/api/') && !path.startsWith('/api?')) {
          console.warn(
            `[API Client Warning] API 경로가 '/api/'로 시작하지 않습니다: "${path}"\n` +
              `올바른 형식: '/api/endpoint' (예: '/api/equipment', '/api/calibration')`
          );
        }
        // /api/api 중복 감지
        if (path && path.includes('/api/api')) {
          console.error(
            `[API Client Error] API 경로에 '/api/api' 중복이 감지되었습니다: "${path}"\n` +
              `환경변수 NEXT_PUBLIC_API_URL에 '/api'가 포함되어 있지 않은지 확인하세요.`
          );
        }
      }
    };
    const apiClient =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'default'
      ].create({
        baseURL:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$config$2f$api$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'API_BASE_URL'
          ],
        headers: {
          'Content-Type': 'application/json',
        },
      });
    /**
     * NextAuth 세션에서 액세스 토큰 가져오기
     * NextAuth가 세션을 클라이언트에 캐싱하므로 별도 캐시 불필요
     */ async function getAccessToken() {
      try {
        const session = await (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'getSession'
        ])();
        if (session?.error === 'RefreshAccessTokenError') {
          // Refresh token도 만료됨 — 재로그인 필요
          console.error('[API Client] 세션 갱신 실패 (RefreshAccessTokenError)');
          return null;
        }
        if (session?.accessToken) {
          return session.accessToken;
        } else if (session) {
          console.warn('[API Client] 세션은 있지만 accessToken이 없습니다:', Object.keys(session));
        }
      } catch (error) {
        console.error('[API Client] 세션 조회 실패:', error);
      }
      return null;
    }
    function clearTokenCache() {
      // no-op: NextAuth가 세션 관리를 전담
    }
    // 요청 인터셉터 설정
    apiClient.interceptors.request.use(
      async (config) => {
        // ✅ 개발 모드에서 API 경로 유효성 검사
        if (config.url) {
          validateApiPath(config.url);
        }
        // ✅ NextAuth 세션에서 토큰 가져오기 (localStorage 사용 금지)
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // i18n: 현재 로케일을 Accept-Language 헤더로 전달 (백엔드 에러 메시지 로케일화)
        // NEXT_LOCALE 쿠키를 우선 읽어 document.lang의 stale 문제 방지
        if (typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
          const locale = cookieMatch?.[1] || document.documentElement.lang || 'ko';
          config.headers['Accept-Language'] = locale;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    // 응답 인터셉터 설정
    apiClient.interceptors.response.use(
      (response) => {
        // ResponseTransformInterceptor 래핑 해제 (SSOT: 클라이언트 레벨에서 중앙화)
        // 백엔드가 { success, data, message, timestamp } 형태로 래핑하는 경우 data만 추출
        const responseData = response.data;
        if (
          responseData &&
          typeof responseData === 'object' &&
          'success' in responseData &&
          responseData.success === true &&
          'data' in responseData
        ) {
          response.data = responseData.data;
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        // 토큰이 만료된 경우 (401) - 1회 재시도
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // getSession()을 호출하면 NextAuth JWT 콜백이 트리거되어 토큰 갱신
            const session = await (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'getSession'
            ])();
            if (session?.error === 'RefreshAccessTokenError') {
              // Refresh token도 만료됨 — AuthSync SSOT 핸들러로 위임
              if (('TURBOPACK compile-time truthy', 1)) {
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
              }
              return Promise.reject(error);
            }
            if (session?.accessToken) {
              // 새로운 토큰으로 원래 요청 재시도
              originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
              return apiClient(originalRequest);
            }
          } catch (refreshError) {
            console.error('[API Client] 토큰 갱신 실패:', refreshError);
          }
          // 토큰 갱신 실패 — AuthSync SSOT 핸들러로 위임
          if (('TURBOPACK compile-time truthy', 1)) {
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
          }
          return Promise.reject(error);
        }
        // ✅ 공통 에러 변환 유틸리티 사용: ApiError로 변환하여 상세 정보 유지
        const apiError = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createApiError'
        ])(error);
        return Promise.reject(apiError);
      }
    );
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/authenticated-client-provider.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'AuthenticatedClientProvider',
      () => AuthenticatedClientProvider,
      'useAuthenticatedClient',
      () => useAuthenticatedClient,
      'useIsSessionReady',
      () => useIsSessionReady,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/utils/response-transformers.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$config$2f$api$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/config/api-config.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature(),
      _s1 = __turbopack_context__.k.signature(),
      _s2 = __turbopack_context__.k.signature();
    ('use client');
    /**
     * ============================================================================
     * Authenticated API Client Provider
     * ============================================================================
     *
     * NextAuth + axios 통합 Best Practice:
     * - useSession() hook으로 세션 토큰 가져오기 (getSession() 대신)
     * - 세션 변경 시 axios 인스턴스 자동 재생성
     * - 모든 Client Component에서 인증된 API 호출 가능
     *
     * 장점:
     * - ✅ 매 요청마다 getSession() 호출 불필요 (성능 개선)
     * - ✅ SessionProvider context 활용
     * - ✅ 세션 준비 타이밍 이슈 해결
     * - ✅ 토큰 갱신 시 자동 반영
     *
     * 사용법:
     * ```typescript
     * const client = useAuthenticatedClient();
     * const response = await client.get('/api/equipment');
     * ```
     * ============================================================================
     */ const AuthenticatedClientContext = /*#__PURE__*/ (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createContext'
    ])(null);
    function AuthenticatedClientProvider({ children }) {
      _s();
      const { data: session } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSession'
      ])();
      /**
       * ✅ 세션 토큰이 변경될 때마다 axios 인스턴스 재생성
       * useMemo로 불필요한 재생성 방지
       */ const apiClient = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'AuthenticatedClientProvider.useMemo[apiClient]': () => {
            const instance =
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'default'
              ].create({
                baseURL:
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$config$2f$api$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'API_BASE_URL'
                  ],
                headers: {
                  'Content-Type': 'application/json',
                },
                timeout: 30000,
              });
            // ✅ 요청 인터셉터: 세션이 있으면 모든 요청에 Authorization 헤더 자동 추가
            instance.interceptors.request.use(
              {
                'AuthenticatedClientProvider.useMemo[apiClient]': (config) => {
                  if (session?.accessToken) {
                    config.headers.Authorization = `Bearer ${session.accessToken}`;
                  }
                  return config;
                },
              }['AuthenticatedClientProvider.useMemo[apiClient]'],
              {
                'AuthenticatedClientProvider.useMemo[apiClient]': (error) => Promise.reject(error),
              }['AuthenticatedClientProvider.useMemo[apiClient]']
            );
            // ✅ 응답 인터셉터: 401 시 세션 갱신 1회 시도 → 재요청 → 실패 시에만 이벤트 dispatch
            instance.interceptors.response.use(
              {
                'AuthenticatedClientProvider.useMemo[apiClient]': (response) => response,
              }['AuthenticatedClientProvider.useMemo[apiClient]'],
              {
                'AuthenticatedClientProvider.useMemo[apiClient]': async (error) => {
                  const originalRequest = error.config;
                  if (
                    error.response?.status === 401 &&
                    originalRequest &&
                    !originalRequest._authRetried
                  ) {
                    originalRequest._authRetried = true;
                    try {
                      // getSession() 호출 → JWT 콜백 트리거 → 토큰 자동 갱신
                      const freshSession = await (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'getSession'
                      ])();
                      if (freshSession?.accessToken) {
                        originalRequest.headers.Authorization = `Bearer ${freshSession.accessToken}`;
                        return instance(originalRequest);
                      }
                    } catch {
                      // 세션 갱신 실패 — 아래에서 이벤트 dispatch
                    }
                    // 재시도도 실패 → 진짜 세션 만료
                    if (('TURBOPACK compile-time truthy', 1)) {
                      window.dispatchEvent(new CustomEvent('auth:session-expired'));
                    }
                  }
                  // 공통 에러 변환
                  const apiError = (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$utils$2f$response$2d$transformers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'createApiError'
                  ])(error);
                  return Promise.reject(apiError);
                },
              }['AuthenticatedClientProvider.useMemo[apiClient]']
            );
            return instance;
          },
        }['AuthenticatedClientProvider.useMemo[apiClient]'],
        [session?.accessToken]
      ); // ✅ 토큰 변경 시에만 재생성
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        AuthenticatedClientContext.Provider,
        {
          value: apiClient,
          children: children,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/lib/api/authenticated-client-provider.tsx',
          lineNumber: 102,
          columnNumber: 5,
        },
        this
      );
    }
    _s(AuthenticatedClientProvider, 'Ew/8A6bNIqY0j3I1v9M+iBO2dHQ=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSession'
        ],
      ];
    });
    _c = AuthenticatedClientProvider;
    function useAuthenticatedClient() {
      _s1();
      const client = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useContext'
      ])(AuthenticatedClientContext);
      if (!client) {
        throw new Error(
          'useAuthenticatedClient must be used within AuthenticatedClientProvider. ' +
            'Ensure your component is wrapped with <AuthenticatedClientProvider>.'
        );
      }
      return client;
    }
    _s1(useAuthenticatedClient, '6C1IqtdJdCPZ/voWsX/6r3Oc32M=');
    function useIsSessionReady() {
      _s2();
      const { status } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSession'
      ])();
      return status === 'authenticated';
    }
    _s2(useIsSessionReady, 'KVv0bvSy9cTf75conWl3ut0s0a8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSession'
        ],
      ];
    });
    var _c;
    __turbopack_context__.k.register(_c, 'AuthenticatedClientProvider');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/auth-token.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 인증 토큰 라이프사이클 + 세션 동작 상수 — SSOT
     *
     * - 토큰 수명 (ACCESS/REFRESH): 프론트엔드(NextAuth) + 백엔드(NestJS JWT) 공유
     * - Idle Timeout / Session Sync: 프론트엔드 전용
     *
     * ⚠️ 토큰 수명 값을 변경하면 양쪽 시스템에 동시 적용됩니다. 반드시 검토 후 변경하세요.
     *
     * 의존 관계 (안전 조건):
     *   REFRESH_BUFFER_SECONDS < ACCESS_TOKEN_TTL_SECONDS / 2
     *   현재: 60 < 450  ✅
     *
     *   REFRESH_BUFFER_SECONDS >> 실제 refresh API 응답 시간 (~200ms)
     *   현재: 60s >> 0.2s  ✅
     */ /** Access Token 유효 기간 (초). 백엔드 JWT 서명과 프론트엔드 갱신 트리거에 사용. */ __turbopack_context__.s(
      [
        'ABSOLUTE_SESSION_MAX_AGE_SECONDS',
        () => ABSOLUTE_SESSION_MAX_AGE_SECONDS,
        'ACCESS_TOKEN_EXPIRES_IN',
        () => ACCESS_TOKEN_EXPIRES_IN,
        'ACCESS_TOKEN_TTL_SECONDS',
        () => ACCESS_TOKEN_TTL_SECONDS,
        'IDLE_ACTIVITY_THROTTLE_MS',
        () => IDLE_ACTIVITY_THROTTLE_MS,
        'IDLE_TIMEOUT_SECONDS',
        () => IDLE_TIMEOUT_SECONDS,
        'IDLE_WARNING_BEFORE_SECONDS',
        () => IDLE_WARNING_BEFORE_SECONDS,
        'REFRESH_BUFFER_SECONDS',
        () => REFRESH_BUFFER_SECONDS,
        'REFRESH_TOKEN_EXPIRES_IN',
        () => REFRESH_TOKEN_EXPIRES_IN,
        'REFRESH_TOKEN_TTL_SECONDS',
        () => REFRESH_TOKEN_TTL_SECONDS,
        'SESSION_SYNC_CHANNEL',
        () => SESSION_SYNC_CHANNEL,
        'SESSION_SYNC_MESSAGE',
        () => SESSION_SYNC_MESSAGE,
      ]
    );
    const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 900s = 15분
    const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 604800s = 7일
    const ABSOLUTE_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 2592000s = 30일
    const REFRESH_BUFFER_SECONDS = 60;
    const ACCESS_TOKEN_EXPIRES_IN = `${ACCESS_TOKEN_TTL_SECONDS}s`; // '900s'
    const REFRESH_TOKEN_EXPIRES_IN = `${REFRESH_TOKEN_TTL_SECONDS}s`; // '604800s'
    const IDLE_TIMEOUT_SECONDS = 30 * 60; // 1800s = 30분
    const IDLE_WARNING_BEFORE_SECONDS = 5 * 60; // 300s = 5분
    const IDLE_ACTIVITY_THROTTLE_MS = 5_000; // 5초
    const SESSION_SYNC_CHANNEL = 'equipment-mgmt-session-sync';
    const SESSION_SYNC_MESSAGE = {
      /** 사용자 수동 로그아웃 (use-auth.ts → providers.tsx) */ LOGOUT: 'logout',
      /** Idle Timeout 자동 로그아웃 (use-idle-timeout.ts → providers.tsx) */ IDLE_LOGOUT:
        'idle-logout',
      /** "계속 사용" 버튼 클릭 (use-idle-timeout.ts ↔ use-idle-timeout.ts) */ ACTIVITY_RESET:
        'activity-reset',
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/roles.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'ADMIN_ROLES',
      () => ADMIN_ROLES,
      'APPROVAL_ROLES',
      () => APPROVAL_ROLES,
      'ROLE_HIERARCHY',
      () => ROLE_HIERARCHY,
      'SITE_RESTRICTED_ROLES',
      () => SITE_RESTRICTED_ROLES,
      'TEAMS_SITE_RESTRICTED_ROLES',
      () => TEAMS_SITE_RESTRICTED_ROLES,
      'TEAM_RESTRICTED_ROLES',
      () => TEAM_RESTRICTED_ROLES,
      'canApprove',
      () => canApprove,
      'hasEqualOrHigherRole',
      () => hasEqualOrHigherRole,
      'isLabManager',
      () => isLabManager,
      'isLabManagerOrAbove',
      () => isLabManagerOrAbove,
      'isQualityManager',
      () => isQualityManager,
      'isQualityManagerOrAbove',
      () => isQualityManagerOrAbove,
      'isSiteRestricted',
      () => isSiteRestricted,
      'isSystemAdmin',
      () => isSystemAdmin,
      'isTeamRestricted',
      () => isTeamRestricted,
      'isTechnicalManagerOrAbove',
      () => isTechnicalManagerOrAbove,
    ]);
    /**
     * 사용자 역할 상수
     *
     * ⚠️ SSOT: 역할의 원본 정의는 @equipment-management/schemas의 UserRoleEnum
     * 이 파일은 re-export + 추가 유틸리티 제공
     *
     * 역할 계층 (UL-QP-18 기준 + 3단계 승인):
     * - test_engineer: 시험실무자 (기본 운영, 승인 요청)
     * - technical_manager: 기술책임자 (승인, 교정 관리, 교정계획서 작성)
     * - quality_manager: 품질책임자 (교정계획서 검토)
     * - lab_manager: 시험소장 (전체 권한, 자가 승인, 교정계획서 최종 승인)
     * - system_admin: 시스템 관리자 (전체 접근, CREATE_CALIBRATION 제외)
     */ // SSOT에서 re-export
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    const ROLE_HIERARCHY = {
      test_engineer: 1,
      technical_manager: 2,
      quality_manager: 3,
      lab_manager: 4,
      system_admin: 5,
    };
    function hasEqualOrHigherRole(userRole, requiredRole) {
      return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
    }
    function isTechnicalManagerOrAbove(role) {
      return hasEqualOrHigherRole(role, 'technical_manager');
    }
    function isQualityManagerOrAbove(role) {
      return hasEqualOrHigherRole(role, 'quality_manager');
    }
    function isQualityManager(role) {
      return role === 'quality_manager';
    }
    function isLabManager(role) {
      return role === 'lab_manager';
    }
    function isLabManagerOrAbove(role) {
      return hasEqualOrHigherRole(role, 'lab_manager');
    }
    function isSystemAdmin(role) {
      return role === 'system_admin';
    }
    const APPROVAL_ROLES = ['technical_manager', 'quality_manager', 'lab_manager', 'system_admin'];
    const ADMIN_ROLES = ['lab_manager', 'system_admin'];
    const TEAM_RESTRICTED_ROLES = ['test_engineer', 'technical_manager'];
    const SITE_RESTRICTED_ROLES = [
      'test_engineer',
      'technical_manager',
      'quality_manager',
      'lab_manager',
    ];
    function canApprove(role) {
      return APPROVAL_ROLES.includes(role);
    }
    function isTeamRestricted(role) {
      return TEAM_RESTRICTED_ROLES.includes(role);
    }
    function isSiteRestricted(role) {
      return SITE_RESTRICTED_ROLES.includes(role);
    }
    const TEAMS_SITE_RESTRICTED_ROLES = ['test_engineer', 'technical_manager', 'lab_manager'];
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/permissions.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 권한 상수 정의
     *
     * ⚠️ SSOT: 이 파일이 권한의 단일 소스
     * 백엔드/프론트엔드 모두 이 파일에서 import
     *
     * 권한 명명 규칙: action:resource[:sub-resource]
     * - view: 조회
     * - create: 생성
     * - update: 수정
     * - delete: 삭제
     * - approve: 승인
     * - reject: 반려
     */ __turbopack_context__.s([
      'PERMISSION_LABELS',
      () => PERMISSION_LABELS,
      'Permission',
      () => Permission,
    ]);
    var Permission = /*#__PURE__*/ (function (Permission) {
      // ============================================================================
      // 장비 관련 권한
      // ============================================================================
      Permission['VIEW_EQUIPMENT'] = 'view:equipment';
      Permission['CREATE_EQUIPMENT'] = 'create:equipment';
      Permission['UPDATE_EQUIPMENT'] = 'update:equipment';
      Permission['DELETE_EQUIPMENT'] = 'delete:equipment';
      Permission['APPROVE_EQUIPMENT'] = 'approve:equipment';
      Permission['REJECT_EQUIPMENT'] = 'reject:equipment';
      Permission['VIEW_EQUIPMENT_REQUESTS'] = 'view:equipment:requests';
      // ============================================================================
      // 반출 관련 권한 (교정/수리/시험소간 대여 모두 포함)
      // ============================================================================
      Permission['VIEW_CHECKOUTS'] = 'view:checkouts';
      Permission['CREATE_CHECKOUT'] = 'create:checkout';
      Permission['UPDATE_CHECKOUT'] = 'update:checkout';
      Permission['DELETE_CHECKOUT'] = 'delete:checkout';
      Permission['APPROVE_CHECKOUT'] = 'approve:checkout';
      Permission['REJECT_CHECKOUT'] = 'reject:checkout';
      Permission['START_CHECKOUT'] = 'start:checkout';
      Permission['COMPLETE_CHECKOUT'] = 'complete:checkout';
      Permission['CANCEL_CHECKOUT'] = 'cancel:checkout';
      // ============================================================================
      // 교정 관련 권한
      // ============================================================================
      Permission['VIEW_CALIBRATIONS'] = 'view:calibrations';
      Permission['CREATE_CALIBRATION'] = 'create:calibration';
      Permission['UPDATE_CALIBRATION'] = 'update:calibration';
      Permission['DELETE_CALIBRATION'] = 'delete:calibration';
      Permission['APPROVE_CALIBRATION'] = 'approve:calibration';
      Permission['VIEW_CALIBRATION_REQUESTS'] = 'view:calibration:requests';
      // ============================================================================
      // 보정계수 관련 권한
      // ============================================================================
      Permission['VIEW_CALIBRATION_FACTORS'] = 'view:calibration-factors';
      Permission['CREATE_CALIBRATION_FACTOR'] = 'create:calibration-factor';
      Permission['APPROVE_CALIBRATION_FACTOR'] = 'approve:calibration-factor';
      Permission['VIEW_CALIBRATION_FACTOR_REQUESTS'] = 'view:calibration-factor:requests';
      // ============================================================================
      // 부적합 관련 권한
      // ============================================================================
      Permission['VIEW_NON_CONFORMANCES'] = 'view:non-conformances';
      Permission['CREATE_NON_CONFORMANCE'] = 'create:non-conformance';
      Permission['UPDATE_NON_CONFORMANCE'] = 'update:non-conformance';
      Permission['CLOSE_NON_CONFORMANCE'] = 'close:non-conformance';
      // ============================================================================
      // 소프트웨어 관련 권한
      // ============================================================================
      Permission['VIEW_SOFTWARE'] = 'view:software';
      Permission['CREATE_SOFTWARE_CHANGE'] = 'create:software-change';
      Permission['APPROVE_SOFTWARE_CHANGE'] = 'approve:software-change';
      Permission['VIEW_SOFTWARE_REQUESTS'] = 'view:software:requests';
      // ============================================================================
      // 팀 관련 권한
      // ============================================================================
      Permission['VIEW_TEAMS'] = 'view:teams';
      Permission['CREATE_TEAMS'] = 'create:teams';
      Permission['UPDATE_TEAMS'] = 'update:teams';
      Permission['DELETE_TEAMS'] = 'delete:teams';
      // ============================================================================
      // 사용자 관리 권한
      // ============================================================================
      Permission['VIEW_USERS'] = 'view:users';
      Permission['UPDATE_USERS'] = 'update:users';
      Permission['MANAGE_ROLES'] = 'manage:roles';
      // ============================================================================
      // 알림 관련 권한
      // ============================================================================
      Permission['VIEW_NOTIFICATIONS'] = 'view:notifications';
      Permission['CREATE_NOTIFICATION'] = 'create:notification';
      Permission['UPDATE_NOTIFICATION'] = 'update:notification';
      Permission['DELETE_NOTIFICATION'] = 'delete:notification';
      Permission['CREATE_SYSTEM_NOTIFICATION'] = 'create:system:notification';
      Permission['MANAGE_NOTIFICATION_SETTINGS'] = 'manage:notification:settings';
      // ============================================================================
      // 통계 및 보고서 관련 권한
      // ============================================================================
      Permission['VIEW_STATISTICS'] = 'view:statistics';
      Permission['EXPORT_REPORTS'] = 'export:reports';
      Permission['CREATE_DASHBOARD'] = 'create:dashboard';
      Permission['MANAGE_REPORTS'] = 'manage:reports';
      // ============================================================================
      // 교정계획서 관련 권한 (3단계 승인 워크플로우)
      // ============================================================================
      Permission['VIEW_CALIBRATION_PLANS'] = 'view:calibration-plans';
      Permission['CREATE_CALIBRATION_PLAN'] = 'create:calibration-plan';
      Permission['UPDATE_CALIBRATION_PLAN'] = 'update:calibration-plan';
      Permission['DELETE_CALIBRATION_PLAN'] = 'delete:calibration-plan';
      Permission['SUBMIT_CALIBRATION_PLAN'] = 'submit:calibration-plan';
      Permission['REVIEW_CALIBRATION_PLAN'] = 'review:calibration-plan';
      Permission['APPROVE_CALIBRATION_PLAN'] = 'approve:calibration-plan';
      Permission['REJECT_CALIBRATION_PLAN'] = 'reject:calibration-plan';
      Permission['CONFIRM_CALIBRATION_PLAN_ITEM'] = 'confirm:calibration-plan-item';
      // ============================================================================
      // 감사 로그 관련 권한
      // ============================================================================
      Permission['VIEW_AUDIT_LOGS'] = 'view:audit-logs';
      // ============================================================================
      // 폐기 관련 권한 (2단계 승인 워크플로우)
      // ============================================================================
      Permission['REQUEST_DISPOSAL'] = 'request:disposal';
      Permission['REVIEW_DISPOSAL'] = 'review:disposal';
      Permission['APPROVE_DISPOSAL'] = 'approve:disposal';
      Permission['VIEW_DISPOSAL_REQUESTS'] = 'view:disposal:requests';
      // ============================================================================
      // 장비 반입 관련 권한 (렌탈 + 내부 공용 통합)
      // ============================================================================
      Permission['VIEW_EQUIPMENT_IMPORTS'] = 'view:equipment-imports';
      Permission['CREATE_EQUIPMENT_IMPORT'] = 'create:equipment-import';
      Permission['APPROVE_EQUIPMENT_IMPORT'] = 'approve:equipment-import';
      Permission['COMPLETE_EQUIPMENT_IMPORT'] = 'complete:equipment-import';
      Permission['CANCEL_EQUIPMENT_IMPORT'] = 'cancel:equipment-import';
      // ============================================================================
      // 시스템 설정 관련 권한
      // ============================================================================
      Permission['MANAGE_SYSTEM_SETTINGS'] = 'manage:system:settings';
      Permission['VIEW_SYSTEM_SETTINGS'] = 'view:system:settings';
      // ============================================================================
      // DEPRECATED: Legacy rental import permissions (backward compatibility)
      // ============================================================================
      /**
       * @deprecated Use VIEW_EQUIPMENT_IMPORTS instead
       */ Permission['VIEW_RENTAL_IMPORTS'] = 'view:equipment-imports';
      /**
       * @deprecated Use CREATE_EQUIPMENT_IMPORT instead
       */ Permission['CREATE_RENTAL_IMPORT'] = 'create:equipment-import';
      /**
       * @deprecated Use APPROVE_EQUIPMENT_IMPORT instead
       */ Permission['APPROVE_RENTAL_IMPORT'] = 'approve:equipment-import';
      /**
       * @deprecated Use COMPLETE_EQUIPMENT_IMPORT instead
       */ Permission['COMPLETE_RENTAL_IMPORT'] = 'complete:equipment-import';
      /**
       * @deprecated Use CANCEL_EQUIPMENT_IMPORT instead
       */ Permission['CANCEL_RENTAL_IMPORT'] = 'cancel:equipment-import';
      return Permission;
    })({});
    const PERMISSION_LABELS = {
      ['view:equipment']: '장비 조회',
      ['create:equipment']: '장비 등록',
      ['update:equipment']: '장비 수정',
      ['delete:equipment']: '장비 삭제',
      ['approve:equipment']: '장비 승인',
      ['reject:equipment']: '장비 반려',
      ['view:equipment:requests']: '장비 요청 조회',
      ['view:checkouts']: '반출 조회',
      ['create:checkout']: '반출 신청',
      ['update:checkout']: '반출 수정',
      ['delete:checkout']: '반출 삭제',
      ['approve:checkout']: '반출 승인',
      ['reject:checkout']: '반출 반려',
      ['start:checkout']: '반출 시작',
      ['complete:checkout']: '반입 완료',
      ['cancel:checkout']: '반출 취소',
      ['view:calibrations']: '교정 조회',
      ['create:calibration']: '교정 등록',
      ['update:calibration']: '교정 수정',
      ['delete:calibration']: '교정 삭제',
      ['approve:calibration']: '교정 승인',
      ['view:calibration:requests']: '교정 요청 조회',
      ['view:calibration-factors']: '보정계수 조회',
      ['create:calibration-factor']: '보정계수 등록',
      ['approve:calibration-factor']: '보정계수 승인',
      ['view:calibration-factor:requests']: '보정계수 요청 조회',
      ['view:non-conformances']: '부적합 조회',
      ['create:non-conformance']: '부적합 등록',
      ['update:non-conformance']: '부적합 수정',
      ['close:non-conformance']: '부적합 종료',
      ['view:software']: '소프트웨어 조회',
      ['create:software-change']: '소프트웨어 변경 요청',
      ['approve:software-change']: '소프트웨어 변경 승인',
      ['view:software:requests']: '소프트웨어 요청 조회',
      ['view:teams']: '팀 조회',
      ['create:teams']: '팀 생성',
      ['update:teams']: '팀 수정',
      ['delete:teams']: '팀 삭제',
      ['view:users']: '사용자 조회',
      ['update:users']: '사용자 수정',
      ['manage:roles']: '역할 관리',
      ['view:notifications']: '알림 조회',
      ['create:notification']: '알림 생성',
      ['update:notification']: '알림 수정',
      ['delete:notification']: '알림 삭제',
      ['create:system:notification']: '시스템 알림 생성',
      ['manage:notification:settings']: '알림 설정 관리',
      ['view:statistics']: '통계 조회',
      ['export:reports']: '보고서 내보내기',
      ['create:dashboard']: '대시보드 생성',
      ['manage:reports']: '보고서 관리',
      ['view:calibration-plans']: '교정계획서 조회',
      ['create:calibration-plan']: '교정계획서 작성',
      ['update:calibration-plan']: '교정계획서 수정',
      ['delete:calibration-plan']: '교정계획서 삭제',
      ['submit:calibration-plan']: '교정계획서 검토 요청',
      ['review:calibration-plan']: '교정계획서 검토',
      ['approve:calibration-plan']: '교정계획서 최종 승인',
      ['reject:calibration-plan']: '교정계획서 반려',
      ['confirm:calibration-plan-item']: '교정계획 항목 확인',
      ['view:audit-logs']: '감사 로그 조회',
      ['request:disposal']: '폐기 요청',
      ['review:disposal']: '폐기 검토',
      ['approve:disposal']: '폐기 승인',
      ['view:disposal:requests']: '폐기 요청 조회',
      ['view:equipment-imports']: '장비 반입 조회',
      ['create:equipment-import']: '장비 반입 신청',
      ['approve:equipment-import']: '장비 반입 승인',
      ['complete:equipment-import']: '장비 반입 완료',
      ['cancel:equipment-import']: '장비 반입 취소',
      ['manage:system:settings']: '시스템 설정 관리',
      ['view:system:settings']: '시스템 설정 조회',
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/role-permissions.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 역할별 권한 매핑
     *
     * ⚠️ SSOT: 이 파일이 역할-권한 매핑의 단일 소스
     * 백엔드/프론트엔드 모두 이 파일에서 import
     *
     * UL-QP-18 기준 + 3단계 교정계획서 승인:
     * - 시험실무자: 장비 조회, 장비 등록/수정/삭제 요청, 반출 신청, 교정 등록 요청
     * - 기술책임자: 장비 승인, 반출 승인, 교정 승인, 팀 관리, 교정계획서 작성/검토요청
     * - 품질책임자: 교정계획서 검토 (신규)
     * - 시험소장: 모든 권한 (해당 시험소 내, 단 교정 등록 제외), 교정계획서 최종 승인
     *
     * ⚠️ 교정 등록 특수 정책: 시험실무자만 교정 기록 등록 가능 (등록/승인 완전 분리)
     *
     * 참고: 대여(Rentals)는 제거되었으며, 반출(Checkouts)이 교정/수리/시험소간 대여 모두 포함
     */ __turbopack_context__.s([
      'ROLE_PERMISSIONS',
      () => ROLE_PERMISSIONS,
      'getPermissions',
      () => getPermissions,
      'hasPermission',
      () => hasPermission,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/permissions.ts [app-client] (ecmascript)'
      );
    const ROLE_PERMISSIONS = {
      // 시험실무자: 기본 조회 및 장비/반출 요청 권한
      test_engineer: [
        // 장비 관리
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_EQUIPMENT,
        // 반출 관리 (교정/수리/시험소간 대여 포함)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CHECKOUTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CHECKOUT,
        // 교정 관리
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATIONS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CALIBRATION,
        // 팀 조회
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_TEAMS,
        // 알림 기본 권한
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NOTIFICATIONS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_NOTIFICATION,
        // 부적합 관리
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NON_CONFORMANCES,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_NON_CONFORMANCE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_NON_CONFORMANCE,
        // 보정계수
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_FACTORS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CALIBRATION_FACTOR,
        // 소프트웨어
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_SOFTWARE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_SOFTWARE_CHANGE,
        // 폐기
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REQUEST_DISPOSAL,
        // 사용자 조회 (장비 담당자 선택 드롭다운, 팀 목록 등에 필요)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_USERS,
        // 장비 반입 (렌탈 + 내부 공용)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT_IMPORTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_EQUIPMENT_IMPORT,
      ],
      // 기술책임자: 장비 관리 및 승인 권한, 교정계획서 작성/검토요청
      technical_manager: [
        // 장비 관리
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT_REQUESTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REJECT_EQUIPMENT,
        // 반출 관리 (모든 목적 1단계 승인)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CHECKOUTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REJECT_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].START_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].COMPLETE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CANCEL_CHECKOUT,
        // 교정 관리
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATIONS,
        // CREATE_CALIBRATION 제거: UL-QP-18에 따라 시험실무자만 교정 등록 가능
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_CALIBRATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_CALIBRATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_REQUESTS,
        // 사용자/팀 관리
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_USERS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].MANAGE_ROLES,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_TEAMS,
        // 알림
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NOTIFICATIONS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_NOTIFICATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_NOTIFICATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_NOTIFICATION,
        // 부적합 관리
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NON_CONFORMANCES,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_NON_CONFORMANCE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_NON_CONFORMANCE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CLOSE_NON_CONFORMANCE,
        // 보정계수
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_FACTORS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CALIBRATION_FACTOR,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_CALIBRATION_FACTOR,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_FACTOR_REQUESTS,
        // 소프트웨어
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_SOFTWARE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_SOFTWARE_CHANGE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_SOFTWARE_CHANGE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_SOFTWARE_REQUESTS,
        // 교정계획서 (작성, 검토요청)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_PLANS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].SUBMIT_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CONFIRM_CALIBRATION_PLAN_ITEM,
        // 통계
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_STATISTICS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].EXPORT_REPORTS,
        // 폐기
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REQUEST_DISPOSAL,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REVIEW_DISPOSAL,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_DISPOSAL_REQUESTS,
        // 장비 반입 (렌탈 + 내부 공용)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT_IMPORTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_EQUIPMENT_IMPORT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_EQUIPMENT_IMPORT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].COMPLETE_EQUIPMENT_IMPORT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CANCEL_EQUIPMENT_IMPORT,
        // 감사 로그 (소속 팀 스코프)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_AUDIT_LOGS,
      ],
      // 품질책임자: 교정계획서 검토 권한 (신규)
      quality_manager: [
        // 장비 조회 (읽기 전용)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT,
        // 교정 조회
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATIONS,
        // 팀/사용자 조회 (교정계획서 제출자 확인 등)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_TEAMS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_USERS,
        // 알림
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NOTIFICATIONS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_NOTIFICATION,
        // 부적합 조회
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NON_CONFORMANCES,
        // 보정계수 조회
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_FACTORS,
        // 소프트웨어 조회
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_SOFTWARE,
        // 교정계획서 (검토 권한)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_PLANS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REVIEW_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REJECT_CALIBRATION_PLAN,
        // 통계
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_STATISTICS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].EXPORT_REPORTS,
        // 감사 로그 (전체 스코프)
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_AUDIT_LOGS,
      ],
      // 시험소장: 모든 권한 (단, 교정 기록 등록, 시스템 설정 관리 제외)
      // 교정 기록은 시험실무자만 등록 가능 (UL-QP-18 등록/승인 완전 분리 정책)
      lab_manager: Object.values(
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ]
      ).filter(
        (p) =>
          p !==
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Permission'
            ].CREATE_CALIBRATION &&
          p !==
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Permission'
            ].MANAGE_SYSTEM_SETTINGS
      ),
      // 시스템 관리자: lab_manager의 모든 권한 + 시스템 설정 관리
      // UL-QP-18 직무분리: 교정 등록(CREATE_CALIBRATION) 제외
      system_admin: Object.values(
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ]
      ).filter(
        (p) =>
          p !==
          __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Permission'
          ].CREATE_CALIBRATION
      ),
    };
    function hasPermission(role, permission) {
      return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    }
    function getPermissions(role) {
      return ROLE_PERMISSIONS[role] ?? [];
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/permission-categories.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'PERMISSION_CATEGORIES',
      () => PERMISSION_CATEGORIES,
      'PERMISSION_CATEGORY_KEYS',
      () => PERMISSION_CATEGORY_KEYS,
    ]);
    /**
     * 권한 카테고리 SSOT
     *
     * Permission enum의 주석 섹션 구조를 코드로 정형화.
     * 프론트엔드 권한 카드, 향후 관리자 권한 관리 UI에서 재사용.
     *
     * SSOT 체인:
     *   permissions.ts (Permission enum 정의)
     *     → 이 파일 (카테고리별 그룹핑)
     *       → ProfileContent.tsx (권한 카드 UI)
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/permissions.ts [app-client] (ecmascript)'
      );
    const PERMISSION_CATEGORY_KEYS = [
      'equipment',
      'checkouts',
      'calibrations',
      'calibrationFactors',
      'nonConformances',
      'software',
      'teams',
      'users',
      'notifications',
      'reports',
      'calibrationPlans',
      'audit',
      'disposal',
      'equipmentImports',
      'system',
    ];
    const PERMISSION_CATEGORIES = {
      equipment: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REJECT_EQUIPMENT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT_REQUESTS,
      ],
      checkouts: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CHECKOUTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REJECT_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].START_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].COMPLETE_CHECKOUT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CANCEL_CHECKOUT,
      ],
      calibrations: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATIONS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CALIBRATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_CALIBRATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_CALIBRATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_CALIBRATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_REQUESTS,
      ],
      calibrationFactors: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_FACTORS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CALIBRATION_FACTOR,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_CALIBRATION_FACTOR,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_FACTOR_REQUESTS,
      ],
      nonConformances: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NON_CONFORMANCES,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_NON_CONFORMANCE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_NON_CONFORMANCE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CLOSE_NON_CONFORMANCE,
      ],
      software: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_SOFTWARE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_SOFTWARE_CHANGE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_SOFTWARE_CHANGE,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_SOFTWARE_REQUESTS,
      ],
      teams: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_TEAMS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_TEAMS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_TEAMS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_TEAMS,
      ],
      users: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_USERS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_USERS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].MANAGE_ROLES,
      ],
      notifications: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_NOTIFICATIONS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_NOTIFICATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_NOTIFICATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_NOTIFICATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_SYSTEM_NOTIFICATION,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].MANAGE_NOTIFICATION_SETTINGS,
      ],
      reports: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_STATISTICS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].EXPORT_REPORTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_DASHBOARD,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].MANAGE_REPORTS,
      ],
      calibrationPlans: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_CALIBRATION_PLANS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].UPDATE_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].DELETE_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].SUBMIT_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REVIEW_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REJECT_CALIBRATION_PLAN,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CONFIRM_CALIBRATION_PLAN_ITEM,
      ],
      audit: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_AUDIT_LOGS,
      ],
      disposal: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REQUEST_DISPOSAL,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].REVIEW_DISPOSAL,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_DISPOSAL,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_DISPOSAL_REQUESTS,
      ],
      equipmentImports: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_EQUIPMENT_IMPORTS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CREATE_EQUIPMENT_IMPORT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].APPROVE_EQUIPMENT_IMPORT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].COMPLETE_EQUIPMENT_IMPORT,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].CANCEL_EQUIPMENT_IMPORT,
      ],
      system: [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].MANAGE_SYSTEM_SETTINGS,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Permission'
        ].VIEW_SYSTEM_SETTINGS,
      ],
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * API 엔드포인트 상수
     *
     * ⚠️ SSOT: 이 파일이 API 경로의 단일 소스
     * 프론트엔드 API 클라이언트에서 import하여 사용
     *
     * 명명 규칙:
     * - 리소스별 그룹화 (EQUIPMENT, CHECKOUTS 등)
     * - 기본 CRUD: LIST, GET, CREATE, UPDATE, DELETE
     * - 특수 액션: APPROVE, REJECT, SUBMIT 등
     */ __turbopack_context__.s(['API_ENDPOINTS', () => API_ENDPOINTS]);
    const API_ENDPOINTS = {
      // ============================================================================
      // 장비 관리
      // ============================================================================
      EQUIPMENT: {
        LIST: '/api/equipment',
        GET: (id) => `/api/equipment/${id}`,
        CREATE: '/api/equipment',
        UPDATE: (id) => `/api/equipment/${id}`,
        DELETE: (id) => `/api/equipment/${id}`,
        /** 관리번호 중복 검사 - excludeId는 수정 시 현재 장비 ID */ CHECK_MANAGEMENT_NUMBER:
          '/api/equipment/check-management-number',
        HISTORY: (id) => `/api/equipment/${id}/history`,
        NON_CONFORMANCE: (id) => `/api/equipment/${id}/non-conformance`,
        CALIBRATION_HISTORY: (id) => `/api/equipment/${id}/calibration-history`,
        /** 장비 상태 변경 */ STATUS: (id) => `/api/equipment/${id}/status`,
        /** 교정 예정 장비 조회 */ CALIBRATION_DUE: '/api/equipment/calibration/due',
        /** 팀별 장비 조회 */ TEAM: (teamId) => `/api/equipment/team/${teamId}`,
        /** 파일 첨부 */ ATTACHMENTS: '/api/equipment/attachments',
        /** 공용장비 등록 */ SHARED: '/api/equipment/shared',
        // 위치 변동 이력
        LOCATION_HISTORY: {
          LIST: (id) => `/api/equipment/${id}/location-history`,
          CREATE: (id) => `/api/equipment/${id}/location-history`,
          DELETE: (historyId) => `/api/equipment/location-history/${historyId}`,
        },
        // 유지보수 내역
        MAINTENANCE_HISTORY: {
          LIST: (id) => `/api/equipment/${id}/maintenance-history`,
          CREATE: (id) => `/api/equipment/${id}/maintenance-history`,
          DELETE: (historyId) => `/api/equipment/maintenance-history/${historyId}`,
        },
        // 사고/손상 이력
        INCIDENT_HISTORY: {
          LIST: (id) => `/api/equipment/${id}/incident-history`,
          CREATE: (id) => `/api/equipment/${id}/incident-history`,
          DELETE: (historyId) => `/api/equipment/incident-history/${historyId}`,
        },
        // 장비 등록/수정/삭제 요청 승인
        REQUESTS: {
          LIST: '/api/equipment/requests',
          GET: (id) => `/api/equipment/requests/${id}`,
          PENDING: '/api/equipment/requests/pending',
          APPROVE: (id) => `/api/equipment/requests/${id}/approve`,
          REJECT: (id) => `/api/equipment/requests/${id}/reject`,
        },
        /** 장비별 반출 이력 */ CHECKOUTS: (equipmentId) =>
          `/api/equipment/${equipmentId}/checkouts`,
        // 수리 이력
        REPAIR_HISTORY: {
          LIST: (equipmentId) => `/api/equipment/${equipmentId}/repair-history`,
          CREATE: (equipmentId) => `/api/equipment/${equipmentId}/repair-history`,
          RECENT: (equipmentId) => `/api/equipment/${equipmentId}/repair-history/recent`,
          GET: (id) => `/api/repair-history/${id}`,
          UPDATE: (id) => `/api/repair-history/${id}`,
          DELETE: (id) => `/api/repair-history/${id}`,
        },
        // 장비 폐기
        DISPOSAL: {
          REQUEST: (equipmentId) => `/api/equipment/${equipmentId}/disposal/request`,
          REVIEW: (equipmentId) => `/api/equipment/${equipmentId}/disposal/review`,
          APPROVE: (equipmentId) => `/api/equipment/${equipmentId}/disposal/approve`,
          CANCEL: (equipmentId) => `/api/equipment/${equipmentId}/disposal/request`,
          CURRENT: (equipmentId) => `/api/equipment/${equipmentId}/disposal/current`,
          // 승인 대기 목록
          PENDING_REVIEW: '/api/disposal-requests/pending-review',
          PENDING_APPROVAL: '/api/disposal-requests/pending-approval',
        },
      },
      // ============================================================================
      // 반출 관리 (교정/수리/대여)
      // ============================================================================
      CHECKOUTS: {
        LIST: '/api/checkouts',
        GET: (id) => `/api/checkouts/${id}`,
        CREATE: '/api/checkouts',
        UPDATE: (id) => `/api/checkouts/${id}`,
        DELETE: (id) => `/api/checkouts/${id}`,
        APPROVE: (id) => `/api/checkouts/${id}/approve`,
        REJECT: (id) => `/api/checkouts/${id}/reject`,
        START: (id) => `/api/checkouts/${id}/start`,
        COMPLETE: (id) => `/api/checkouts/${id}/complete`,
        CANCEL: (id) => `/api/checkouts/${id}/cancel`,
        RETURN: (id) => `/api/checkouts/${id}/return`,
        APPROVE_RETURN: (id) => `/api/checkouts/${id}/approve-return`,
        REJECT_RETURN: (id) => `/api/checkouts/${id}/reject-return`,
        // 대여 목적 양측 확인 (상태 확인 기록)
        CONDITION_CHECK: (id) => `/api/checkouts/${id}/condition-check`,
        CONDITION_CHECKS: (id) => `/api/checkouts/${id}/condition-checks`,
        // 확인 필요 목록 조회
        PENDING_CHECKS: '/api/checkouts/pending-checks',
        // 반출지 목록 조회 (DB에서 실제 사용된 값들)
        DESTINATIONS: '/api/checkouts/destinations',
      },
      // ============================================================================
      // 교정 관리
      // ============================================================================
      CALIBRATIONS: {
        LIST: '/api/calibration',
        GET: (id) => `/api/calibration/${id}`,
        CREATE: '/api/calibration',
        UPDATE: (id) => `/api/calibration/${id}`,
        DELETE: (id) => `/api/calibration/${id}`,
        APPROVE: (id) => `/api/calibration/${id}/approve`,
        REJECT: (id) => `/api/calibration/${id}/reject`,
        PENDING: '/api/calibration/pending',
        SUMMARY: '/api/calibration/summary',
        OVERDUE: '/api/calibration/overdue',
        UPCOMING: (days) => `/api/calibration/upcoming${days ? `?days=${days}` : ''}`,
        HISTORY: (equipmentId) => `/api/calibration/equipment/${equipmentId}`,
        HISTORY_LIST: '/api/calibration',
        INTERMEDIATE_CHECKS: {
          ALL: '/api/calibration/intermediate-checks/all',
          LIST: (days) => `/api/calibration/intermediate-checks${days ? `?days=${days}` : ''}`,
          COMPLETE: (id) => `/api/calibration/${id}/intermediate-check/complete`,
        },
        CERTIFICATE: (id) => `/api/calibration/${id}/certificate`,
      },
      // ============================================================================
      // 교정계획서 관리
      // ============================================================================
      CALIBRATION_PLANS: {
        LIST: '/api/calibration-plans',
        GET: (id) => `/api/calibration-plans/${id}`,
        CREATE: '/api/calibration-plans',
        UPDATE: (id) => `/api/calibration-plans/${id}`,
        DELETE: (id) => `/api/calibration-plans/${id}`,
        SUBMIT: (id) => `/api/calibration-plans/${id}/submit`,
        SUBMIT_FOR_REVIEW: (id) => `/api/calibration-plans/${id}/submit-for-review`,
        REVIEW: (id) => `/api/calibration-plans/${id}/review`,
        APPROVE: (id) => `/api/calibration-plans/${id}/approve`,
        REJECT: (id) => `/api/calibration-plans/${id}/reject`,
        ITEMS: (id) => `/api/calibration-plans/${id}/items`,
        CONFIRM_ITEM: (planId, itemId) =>
          `/api/calibration-plans/${planId}/items/${itemId}/confirm`,
        UPDATE_ITEM: (planId, itemId) => `/api/calibration-plans/${planId}/items/${itemId}`,
        NEW_VERSION: (id) => `/api/calibration-plans/${id}/new-version`,
        VERSION_HISTORY: (id) => `/api/calibration-plans/${id}/versions`,
        PDF: (id) => `/api/calibration-plans/${id}/pdf`,
        EXTERNAL_EQUIPMENT: '/api/calibration-plans/equipment/external',
        PENDING_REVIEW: '/api/calibration-plans?status=pending_review',
        PENDING_APPROVAL: '/api/calibration-plans?status=pending_approval',
        VERSIONS: (year, siteId) =>
          `/api/calibration-plans/versions${year || siteId ? '?' : ''}${year ? `year=${year}` : ''}${year && siteId ? '&' : ''}${siteId ? `siteId=${siteId}` : ''}`,
      },
      // ============================================================================
      // 보정계수 관리
      // ============================================================================
      CALIBRATION_FACTORS: {
        LIST: '/api/calibration-factors',
        GET: (id) => `/api/calibration-factors/${id}`,
        CREATE: '/api/calibration-factors',
        UPDATE: (id) => `/api/calibration-factors/${id}`,
        DELETE: (id) => `/api/calibration-factors/${id}`,
        APPROVE: (id) => `/api/calibration-factors/${id}/approve`,
        REJECT: (id) => `/api/calibration-factors/${id}/reject`,
        PENDING: '/api/calibration-factors/pending',
        EQUIPMENT: (equipmentId) => `/api/calibration-factors/equipment/${equipmentId}`,
        REGISTRY: '/api/calibration-factors/registry',
      },
      // ============================================================================
      // 부적합 관리
      // ============================================================================
      NON_CONFORMANCES: {
        LIST: '/api/non-conformances',
        GET: (id) => `/api/non-conformances/${id}`,
        CREATE: '/api/non-conformances',
        UPDATE: (id) => `/api/non-conformances/${id}`,
        DELETE: (id) => `/api/non-conformances/${id}`,
        CLOSE: (id) => `/api/non-conformances/${id}/close`,
        REJECT_CORRECTION: (id) => `/api/non-conformances/${id}/reject-correction`,
        PENDING: '/api/non-conformances/pending',
        EQUIPMENT: (equipmentId) => `/api/non-conformances/equipment/${equipmentId}`,
      },
      // ============================================================================
      // 소프트웨어 관리
      // ============================================================================
      SOFTWARE: {
        LIST: '/api/software',
        GET: (id) => `/api/software/${id}`,
        CREATE: '/api/software',
        UPDATE: (id) => `/api/software/${id}`,
        DELETE: (id) => `/api/software/${id}`,
        CHANGE_REQUEST: '/api/software/change-request',
        PENDING: '/api/software/pending',
        REGISTRY: '/api/software/registry',
        HISTORY: '/api/software/history',
        APPROVE: (id) => `/api/software/${id}/approve`,
        REJECT: (id) => `/api/software/${id}/reject`,
        EQUIPMENT_BY_SOFTWARE: (name) => `/api/software/${encodeURIComponent(name)}/equipment`,
        CHANGES: {
          LIST: '/api/software-changes',
          GET: (id) => `/api/software-changes/${id}`,
          CREATE: '/api/software-changes',
          APPROVE: (id) => `/api/software-changes/${id}/approve`,
          REJECT: (id) => `/api/software-changes/${id}/reject`,
          PENDING: '/api/software-changes/pending',
        },
      },
      // ============================================================================
      // 사용자 관리
      // ============================================================================
      USERS: {
        LIST: '/api/users',
        GET: (id) => `/api/users/${id}`,
        CREATE: '/api/users',
        UPDATE: (id) => `/api/users/${id}`,
        DELETE: (id) => `/api/users/${id}`,
        ME: '/api/users/me',
        PREFERENCES: '/api/users/me/preferences',
        CHANGE_ROLE: (id) => `/api/users/${id}/change-role`,
        ACTIVATE: (id) => `/api/users/${id}/activate`,
        DEACTIVATE: (id) => `/api/users/${id}/deactivate`,
        PERMISSIONS: (id) => `/api/users/${id}/permissions`,
        /** NextAuth 로그인 시 사용자 동기화 (Internal API Key) */ SYNC: '/api/users/sync',
        /** 사용자별 반출 이력 */ CHECKOUTS: (userId) => `/api/users/${userId}/checkouts`,
      },
      // ============================================================================
      // 시스템 설정
      // ============================================================================
      SETTINGS: {
        CALIBRATION: '/api/settings/calibration',
        SYSTEM: '/api/settings/system',
      },
      // ============================================================================
      // 팀 관리
      // ============================================================================
      TEAMS: {
        LIST: '/api/teams',
        GET: (id) => `/api/teams/${id}`,
        CREATE: '/api/teams',
        UPDATE: (id) => `/api/teams/${id}`,
        DELETE: (id) => `/api/teams/${id}`,
      },
      // ============================================================================
      // 알림 관리
      // ============================================================================
      NOTIFICATIONS: {
        LIST: '/api/notifications',
        GET: (id) => `/api/notifications/${id}`,
        UNREAD_COUNT: '/api/notifications/unread-count',
        MARK_READ: (id) => `/api/notifications/${id}/read`,
        MARK_ALL_READ: '/api/notifications/read-all',
        DELETE: (id) => `/api/notifications/${id}`,
        SETTINGS: '/api/notifications/settings',
        STREAM: '/api/notifications/stream',
      },
      // ============================================================================
      // 대시보드
      // ============================================================================
      DASHBOARD: {
        AGGREGATE: '/api/dashboard/aggregate',
        SUMMARY: '/api/dashboard/summary',
        EQUIPMENT_BY_TEAM: '/api/dashboard/equipment-by-team',
        EQUIPMENT_STATUS_STATS: '/api/dashboard/equipment-status-stats',
        OVERDUE_CALIBRATIONS: '/api/dashboard/overdue-calibrations',
        UPCOMING_CALIBRATIONS: '/api/dashboard/upcoming-calibrations',
        OVERDUE_RENTALS: '/api/dashboard/overdue-rentals',
        RECENT_ACTIVITIES: '/api/dashboard/recent-activities',
        PENDING_APPROVAL_COUNTS: '/api/dashboard/pending-approval-counts',
      },
      // ============================================================================
      // 인증
      // ============================================================================
      AUTH: {
        LOGIN: '/api/auth/callback/credentials',
        LOGOUT: '/api/auth/signout',
        SESSION: '/api/auth/session',
        CSRF: '/api/auth/csrf',
        REFRESH: '/api/auth/refresh',
      },
      // ============================================================================
      // 감사 로그
      // ============================================================================
      AUDIT_LOGS: {
        LIST: '/api/audit-logs',
        GET: (id) => `/api/audit-logs/${id}`,
        BY_ENTITY: (entityType, entityId) => `/api/audit-logs/entity/${entityType}/${entityId}`,
        BY_USER: (userId) => `/api/audit-logs/user/${userId}`,
        /** 파일 내보내기 (excel/csv/pdf) — RBAC 스코프 자동 적용 */ EXPORT:
          '/api/reports/export/audit-logs',
      },
      // ============================================================================
      // 장비 반입 관리 (렌탈 + 내부 공용 통합)
      // ============================================================================
      EQUIPMENT_IMPORTS: {
        LIST: '/api/equipment-imports',
        GET: (id) => `/api/equipment-imports/${id}`,
        CREATE: '/api/equipment-imports',
        APPROVE: (id) => `/api/equipment-imports/${id}/approve`,
        REJECT: (id) => `/api/equipment-imports/${id}/reject`,
        RECEIVE: (id) => `/api/equipment-imports/${id}/receive`,
        INITIATE_RETURN: (id) => `/api/equipment-imports/${id}/initiate-return`,
        CANCEL: (id) => `/api/equipment-imports/${id}/cancel`,
      },
      // ============================================================================
      // 승인 관리 통합 API
      // ============================================================================
      /**
       * 통합 승인 카운트 API
       *
       * 모든 승인 카테고리의 대기 개수를 한 번에 조회
       * 기존 13개 별도 API 호출을 1개로 통합하여 성능 향상
       */ APPROVALS: {
        COUNTS: '/api/approvals/counts',
        KPI: '/api/approvals/kpi',
      },
      // ============================================================================
      // 보고서 관리
      // ============================================================================
      REPORTS: {
        EQUIPMENT_USAGE: '/api/reports/equipment-usage',
        CALIBRATION_STATUS: '/api/reports/calibration-status',
        RENTAL_STATISTICS: '/api/reports/rental-statistics',
        UTILIZATION_RATE: '/api/reports/utilization-rate',
        EQUIPMENT_DOWNTIME: '/api/reports/equipment-downtime',
        EXPORT: {
          EQUIPMENT_USAGE: '/api/reports/export/equipment-usage',
          EQUIPMENT_INVENTORY: '/api/reports/export/equipment-inventory',
          CALIBRATION_STATUS: '/api/reports/export/calibration-status',
          UTILIZATION: '/api/reports/export/utilization',
          TEAM_EQUIPMENT: '/api/reports/export/team-equipment',
          MAINTENANCE: '/api/reports/export/maintenance',
        },
      },
      // ============================================================================
      // DEPRECATED: Legacy rental imports (proxy to EQUIPMENT_IMPORTS)
      // ============================================================================
      /**
       * @deprecated Use EQUIPMENT_IMPORTS instead
       * Legacy endpoints for backward compatibility
       */ RENTAL_IMPORTS: {
        LIST: '/api/equipment-imports?sourceType=rental',
        GET: (id) => `/api/equipment-imports/${id}`,
        CREATE: '/api/equipment-imports',
        APPROVE: (id) => `/api/equipment-imports/${id}/approve`,
        REJECT: (id) => `/api/equipment-imports/${id}/reject`,
        RECEIVE: (id) => `/api/equipment-imports/${id}/receive`,
        INITIATE_RETURN: (id) => `/api/equipment-imports/${id}/initiate-return`,
        CANCEL: (id) => `/api/equipment-imports/${id}/cancel`,
      },
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/frontend-routes.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 프론트엔드 라우트 상수
     *
     * ⚠️ SSOT: 이 파일이 프론트엔드 경로의 단일 소스
     * 네비게이션, 리다이렉트, 링크에서 import하여 사용
     *
     * 명명 규칙:
     * - 리소스별 그룹화 (EQUIPMENT, CHECKOUTS 등)
     * - 기본 라우트: LIST, CREATE, DETAIL, EDIT
     * - 특수 페이지: MANAGE, PENDING_CHECKS 등
     */ __turbopack_context__.s(['FRONTEND_ROUTES', () => FRONTEND_ROUTES]);
    const FRONTEND_ROUTES = {
      // ============================================================================
      // 대시보드
      // ============================================================================
      DASHBOARD: '/',
      // ============================================================================
      // 장비 관리
      // ============================================================================
      EQUIPMENT: {
        LIST: '/equipment',
        CREATE: '/equipment/create',
        DETAIL: (id) => `/equipment/${id}`,
        EDIT: (id) => `/equipment/${id}/edit`,
      },
      // ============================================================================
      // 반출 관리 (교정/수리/대여)
      // ============================================================================
      CHECKOUTS: {
        LIST: '/checkouts',
        CREATE: '/checkouts/create',
        /**
         * @deprecated Use ADMIN.APPROVALS instead (통합 승인 페이지 사용)
         * Redirects to /admin/approvals?tab=checkout
         */ MANAGE: '/checkouts/manage',
        DETAIL: (id) => `/checkouts/${id}`,
        CHECK: (id) => `/checkouts/${id}/check`,
        RETURN: (id) => `/checkouts/${id}/return`,
        PENDING_CHECKS: '/checkouts/pending-checks',
      },
      // ============================================================================
      // 교정 관리
      // ============================================================================
      CALIBRATION: {
        LIST: '/calibration',
        REGISTER: '/calibration/register',
        DETAIL: (id) => `/calibration/${id}`,
      },
      // ============================================================================
      // 교정계획서 관리
      // ============================================================================
      CALIBRATION_PLANS: {
        LIST: '/calibration-plans',
        CREATE: '/calibration-plans/create',
        DETAIL: (id) => `/calibration-plans/${id}`,
        EDIT: (id) => `/calibration-plans/${id}/edit`,
      },
      // ============================================================================
      // 부적합 관리
      // ============================================================================
      NON_CONFORMANCES: {
        LIST: '/non-conformances',
        DETAIL: (id) => `/non-conformances/${id}`,
      },
      // ============================================================================
      // 팀 관리
      // ============================================================================
      TEAMS: {
        LIST: '/teams',
        DETAIL: (id) => `/teams/${id}`,
        EDIT: (id) => `/teams/${id}/edit`,
      },
      // ============================================================================
      // 관리자
      // ============================================================================
      ADMIN: {
        EQUIPMENT_APPROVALS: '/admin/equipment-approvals',
        APPROVALS: '/admin/approvals',
        AUDIT_LOGS: '/admin/audit-logs',
        USERS: '/admin/users',
        SETTINGS: '/admin/settings',
      },
      // ============================================================================
      // 알림
      // ============================================================================
      NOTIFICATIONS: {
        LIST: '/notifications',
        SETTINGS: '/notifications/settings',
      },
      // ============================================================================
      // 장비 반입 관리 (렌탈 + 내부 공용, 반출입 관리 하위로 통합)
      // ============================================================================
      EQUIPMENT_IMPORTS: {
        LIST: '/checkouts?view=inbound',
        CREATE_RENTAL: '/checkouts/import/rental',
        CREATE_INTERNAL: '/checkouts/import/shared',
        DETAIL: (id) => `/checkouts/import/${id}`,
        RECEIVE: (id) => `/checkouts/import/${id}/receive`,
      },
      // ============================================================================
      // 설정
      // ============================================================================
      SETTINGS: {
        INDEX: '/settings',
        PROFILE: '/settings/profile',
        NOTIFICATIONS: '/settings/notifications',
        DISPLAY: '/settings/display',
        ADMIN_CALIBRATION: '/settings/admin/calibration',
        ADMIN_SYSTEM: '/settings/admin/system',
      },
      // ============================================================================
      // 인증
      // ============================================================================
      AUTH: {
        LOGIN: '/login',
        LOGOUT: '/logout',
      },
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/checkout-selectability.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * ⚠️ SINGLE SOURCE OF TRUTH: 반출 목적별 장비 선택 가능 상태
     *
     * 이 파일은 반출 신청 시 장비 선택 가능 여부를 판단하는 규칙의 단일 소스입니다.
     * - 프론트엔드: UI에서 선택 가능/불가 표시에 사용
     * - 백엔드: 반출 생성 API에서 장비 상태 검증에 사용
     *
     * 규칙:
     * - 교정/수리: 부적합, 교정기한초과 장비도 보낼 수 있어야 함
     * - 외부 대여: 정상 상태 장비만 대여 가능 (부적합/교정초과 불가)
     * - 공통 차단: 이미 반출 중이거나, 사용 중이거나, 폐기된 장비
     *
     * @see docs/development/API_STANDARDS.md
     */ __turbopack_context__.s([
      'CALIBRATION_REPAIR_ALLOWED_STATUSES',
      () => CALIBRATION_REPAIR_ALLOWED_STATUSES,
      'CHECKOUT_BLOCKED_REASONS',
      () => CHECKOUT_BLOCKED_REASONS,
      'CHECKOUT_HIDDEN_STATUSES',
      () => CHECKOUT_HIDDEN_STATUSES,
      'CHECKOUT_MAX_EQUIPMENT_COUNT',
      () => CHECKOUT_MAX_EQUIPMENT_COUNT,
      'PURPOSE_ALLOWED_STATUSES',
      () => PURPOSE_ALLOWED_STATUSES,
      'RENTAL_ALLOWED_STATUSES',
      () => RENTAL_ALLOWED_STATUSES,
      'getAllowedStatusesForPurpose',
      () => getAllowedStatusesForPurpose,
      'getBlockedReason',
      () => getBlockedReason,
    ]);
    const CHECKOUT_MAX_EQUIPMENT_COUNT = 20;
    const CALIBRATION_REPAIR_ALLOWED_STATUSES = [
      'available',
      'calibration_scheduled',
      'calibration_overdue',
      'non_conforming',
      'spare',
    ];
    const RENTAL_ALLOWED_STATUSES = ['available', 'spare', 'calibration_scheduled'];
    const PURPOSE_ALLOWED_STATUSES = {
      calibration: CALIBRATION_REPAIR_ALLOWED_STATUSES,
      repair: CALIBRATION_REPAIR_ALLOWED_STATUSES,
      rental: RENTAL_ALLOWED_STATUSES,
    };
    function getAllowedStatusesForPurpose(purpose) {
      return PURPOSE_ALLOWED_STATUSES[purpose] ?? CALIBRATION_REPAIR_ALLOWED_STATUSES;
    }
    const CHECKOUT_HIDDEN_STATUSES = [
      'retired',
      'disposed',
      'pending_disposal',
      'temporary',
      'inactive',
    ];
    const CHECKOUT_BLOCKED_REASONS = {
      in_use: {
        default: '현재 다른 사용자가 사용 중인 장비입니다. 반납 후 선택 가능합니다.',
      },
      checked_out: {
        default: '이미 반출 중인 장비입니다. 반입 완료 후 선택 가능합니다.',
      },
      calibration_overdue: {
        default: '',
        purposeOverrides: {
          rental: '교정 기한이 초과된 장비입니다. 외부 대여는 교정이 유효한 장비만 가능합니다.',
        },
      },
      non_conforming: {
        default: '',
        purposeOverrides: {
          rental: '부적합 상태의 장비입니다. 외부 대여는 정상 상태의 장비만 가능합니다.',
        },
      },
    };
    function getBlockedReason(status, purpose) {
      const entry = CHECKOUT_BLOCKED_REASONS[status];
      if (!entry) return undefined;
      // 목적별 오버라이드가 있으면 우선
      const override = entry.purposeOverrides?.[purpose];
      if (override !== undefined) {
        return override || undefined; // 빈 문자열 = 차단 아님
      }
      return entry.default || undefined; // 빈 문자열 = 차단 아님
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/checkout-purpose-styles.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * @deprecated CHECKOUT_PURPOSE_TOKENS으로 이전하세요.
     *
     * ```tsx
     * // Before (deprecated)
     * import { CHECKOUT_PURPOSE_STYLES } from '@equipment-management/shared-constants';
     * className={CHECKOUT_PURPOSE_STYLES.calibration}
     *
     * // After
     * import { CHECKOUT_PURPOSE_TOKENS } from '@/lib/design-tokens';
     * className={CHECKOUT_PURPOSE_TOKENS.calibration.badge}
     * ```
     *
     * SSOT: apps/frontend/lib/design-tokens/components/checkout.ts
     */ __turbopack_context__.s(['CHECKOUT_PURPOSE_STYLES', () => CHECKOUT_PURPOSE_STYLES]);
    const CHECKOUT_PURPOSE_STYLES = {
      /** 교정: 파란색 배지 */ calibration: 'bg-blue-50 text-blue-700 border-blue-200',
      /** 수리: 주황색 배지 */ repair: 'bg-orange-50 text-orange-700 border-orange-200',
      /** 대여: 보라색 배지 */ rental: 'bg-purple-50 text-purple-700 border-purple-200',
      /** 렌탈 반납: 회색 배지 */ return_to_vendor: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/site-options.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['SITE_FILTER_OPTIONS', () => SITE_FILTER_OPTIONS]);
    /**
     * 사이트 필터 옵션 SSOT (Single Source of Truth)
     *
     * 이 파일은 사이트 셀렉트/필터 UI에서 사용하는 옵션의 유일한 소스입니다.
     * schemas 패키지의 SiteEnum + SITE_LABELS에서 프로그래밍적으로 생성합니다.
     *
     * SSOT 체인:
     *   @equipment-management/schemas: SiteEnum (값 정의) + SITE_LABELS (한글 라벨)
     *     → 이 파일: SITE_FILTER_OPTIONS (필터 UI용 옵션 배열)
     *       → EquipmentFilters.tsx, CalibrationSettingsContent.tsx 등 (import)
     *
     * 새 사이트 추가 시:
     * 1. schemas/enums.ts의 SiteEnum, SITE_LABELS, SITE_TO_CODE에 추가
     * 2. 프론트엔드는 이 파일을 통해 자동 반영
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/schemas/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i('[project]/packages/schemas/src/enums.ts [app-client] (ecmascript)');
    const SITE_FILTER_OPTIONS =
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'SiteEnum'
      ].options.map(
        (_c = (site) => ({
          value: site,
          label:
            __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$schemas$2f$src$2f$enums$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'SITE_LABELS'
            ][site],
        }))
      );
    _c1 = SITE_FILTER_OPTIONS;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'SITE_FILTER_OPTIONS$SiteEnum.options.map');
    __turbopack_context__.k.register(_c1, 'SITE_FILTER_OPTIONS');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/notification-categories.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 알림 카테고리 SSOT (Single Source of Truth)
     *
     * 이 파일은 알림 시스템의 카테고리를 중앙에서 정의합니다.
     * 백엔드(notification-registry.ts)와 프론트엔드(필터, 아이콘, 설정)가
     * 모두 이 파일을 참조합니다.
     *
     * SSOT 체인:
     *   이 파일 (카테고리 정의)
     *     → Backend: notification-registry.ts (카테고리별 이벤트 매핑)
     *     → Backend: notification-dispatcher.ts (DB 저장)
     *     → Frontend: notification-item.tsx (아이콘/색상)
     *     → Frontend: NotificationsListContent.tsx (필터)
     *     → Frontend: NotificationsContent.tsx (설정 토글)
     *
     * 새 카테고리 추가 시:
     * 1. 이 파일에 카테고리 추가
     * 2. notification-registry.ts에서 이벤트 매핑
     * 3. 프론트엔드는 자동 반영 (이 파일 import)
     */ /**
     * 알림 카테고리 값 (DB에 저장되는 실제 문자열)
     */ __turbopack_context__.s([
      'NOTIFICATION_CATEGORIES',
      () => NOTIFICATION_CATEGORIES,
      'NOTIFICATION_CATEGORY_DESCRIPTIONS',
      () => NOTIFICATION_CATEGORY_DESCRIPTIONS,
      'NOTIFICATION_CATEGORY_FORM_FIELDS',
      () => NOTIFICATION_CATEGORY_FORM_FIELDS,
      'NOTIFICATION_CATEGORY_LABELS',
      () => NOTIFICATION_CATEGORY_LABELS,
    ]);
    const NOTIFICATION_CATEGORIES = [
      'checkout',
      'calibration',
      'calibration_plan',
      'non_conformance',
      'disposal',
      'equipment_import',
      'equipment',
      'system',
    ];
    const NOTIFICATION_CATEGORY_LABELS = {
      checkout: '반출',
      calibration: '교정',
      calibration_plan: '교정계획',
      non_conformance: '부적합',
      disposal: '폐기',
      equipment_import: '장비 반입',
      equipment: '장비',
      system: '시스템',
    };
    const NOTIFICATION_CATEGORY_DESCRIPTIONS = {
      checkout: '반출 요청, 승인, 반려, 반입 관련 알림',
      calibration: '교정 기록 등록, 승인, 기한 임박/초과 알림',
      calibration_plan: '교정계획서 제출/검토/승인/반려 알림',
      non_conformance: '부적합 등록, 조치 완료, 종료 알림',
      disposal: '폐기 요청, 검토, 승인 알림',
      equipment_import: '장비 반입 요청, 승인 알림',
      equipment: '장비 등록, 수정, 상태 변경 알림',
      system: '시스템 점검 및 중요 공지 알림',
    };
    const NOTIFICATION_CATEGORY_FORM_FIELDS = {
      checkout: 'checkoutEnabled',
      calibration: 'calibrationEnabled',
      calibration_plan: 'calibrationPlanEnabled',
      non_conformance: 'nonConformanceEnabled',
      disposal: 'disposalEnabled',
      equipment_import: 'equipmentImportEnabled',
      equipment: 'equipmentEnabled',
      system: 'systemEnabled',
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/entity-routes.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * ⚠️ SINGLE SOURCE OF TRUTH: 엔티티 라우팅 맵
     *
     * 모든 엔티티 타입 → URL 매핑을 이 파일에서 관리합니다.
     * - 하드코딩 금지 (`/equipment/${id}` 등을 직접 작성하지 말 것)
     * - getEntityRoute(type, id) 헬퍼 함수 사용
     *
     * @see packages/schemas/src/audit-log.ts (AuditEntityType)
     */ __turbopack_context__.s([
      'ENTITY_ROUTES',
      () => ENTITY_ROUTES,
      'getEntityRoute',
      () => getEntityRoute,
      'hasEntityRoute',
      () => hasEntityRoute,
    ]);
    const ENTITY_ROUTES = {
      equipment: (id) => `/equipment/${id}`,
      calibration: (id) => `/calibration/history?selected=${id}`,
      checkout: (id) => `/checkouts/${id}`,
      rental: (id) => `/equipment-imports/${id}`,
      rental_import: (id) => `/equipment-imports/${id}`,
      calibration_plan: (id) => `/calibration-plans/${id}`,
      non_conformance: (id) => `/non-conformances/${id}`,
      user: (id) => `/admin/users/${id}`,
      team: (id) => `/admin/teams/${id}`,
      calibration_factor: (id) => `/equipment/${id}?tab=factors`,
      software: (id) => `/equipment/${id}?tab=software`,
      repair_history: (id) => `/equipment/${id}?tab=maintenance`,
      equipment_import: (id) => `/equipment-imports/${id}`,
      location_history: (id) => `/equipment/${id}?tab=location`,
      maintenance_history: (id) => `/equipment/${id}?tab=maintenance`,
      incident_history: (id) => `/equipment/${id}?tab=incident`,
      settings: (id) => `/settings/${id}`,
    };
    function getEntityRoute(entityType, entityId) {
      const routeFn = ENTITY_ROUTES[entityType];
      if (!routeFn) {
        return null;
      }
      return routeFn(entityId);
    }
    function hasEntityRoute(entityType) {
      return entityType in ENTITY_ROUTES;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/cache-config.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 캐시 TTL 상수 — Backend/Frontend 공유 SSOT
     *
     * Backend: SimpleCacheService.getOrSet() TTL
     * Frontend: React Query staleTime/gcTime
     *
     * 두 계층의 TTL이 동기화되어야 stale-data 윈도우를 최소화합니다.
     * 이 파일이 유일한 소스이며, 로컬 재정의는 금지됩니다.
     *
     * @example
     * // Backend
     * import { CACHE_TTL } from '@equipment-management/shared-constants';
     * cacheService.getOrSet(key, fn, CACHE_TTL.SHORT);
     *
     * // Frontend
     * import { CACHE_TTL } from '@equipment-management/shared-constants';
     * useQuery({ staleTime: CACHE_TTL.SHORT, ... });
     */ __turbopack_context__.s(['CACHE_TTL', () => CACHE_TTL]);
    const CACHE_TTL = {
      /** 30초 — 대시보드 통계, 알림 (자주 변경) */ SHORT: 30_000,
      /** 2분 — 감사 로그 목록, 부적합 목록 */ MEDIUM: 120_000,
      /** 5분 — 장비/교정/반출 목록 및 상세 */ LONG: 300_000,
      /** 10분 — 감사 로그 상세 (append-only) */ VERY_LONG: 600_000,
      /** 30분 — 참조 데이터 (팀, 상태 코드) */ REFERENCE: 1_800_000,
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/approval-kpi.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 승인 KPI 상수 — Backend/Frontend 공유 SSOT
     *
     * 승인 대기 항목의 긴급도 분류 기준 및 KPI 관련 상수.
     * 이 파일이 유일한 소스이며, 프론트엔드/백엔드에서 로컬 재정의 금지.
     *
     * @example
     * // Backend (SQL)
     * import { APPROVAL_KPI } from '@equipment-management/shared-constants';
     * sql`COUNT(*) FILTER (WHERE created_at <= NOW() - interval '${APPROVAL_KPI.URGENT_THRESHOLD_DAYS} days')`
     *
     * // Frontend (visual feedback)
     * import { APPROVAL_KPI } from '@equipment-management/shared-constants';
     * if (elapsedDays >= APPROVAL_KPI.URGENT_THRESHOLD_DAYS) return 'critical';
     */ __turbopack_context__.s(['APPROVAL_KPI', () => APPROVAL_KPI]);
    const APPROVAL_KPI = {
      /** 긴급 임계값 (일) — 이 일수 이상 경과한 항목은 '긴급' 분류 */ URGENT_THRESHOLD_DAYS: 8,
      /** 경고 임계값 (일) — 이 일수 이상 경과한 항목은 '주의' 분류 */ WARNING_THRESHOLD_DAYS: 4,
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/equipment-owner-options.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * 공용장비 소유처 옵션 (SSOT)
     *
     * value: DB owner 컬럼에 저장되는 locale-independent 식별자
     * i18nKey: frontend i18n 키 접미사 (equipment.form.temporary.{i18nKey})
     *
     * EquipmentForm 드롭다운과 E2E 테스트에서 공통으로 사용.
     * 라벨 텍스트는 i18n 시스템에서 관리하므로 여기에 중복 정의하지 않음.
     *
     * ⚠️ value를 변경하면 DB에 저장되는 값이 바뀝니다.
     *    기존 데이터가 있는 경우 마이그레이션이 필요합니다.
     */ __turbopack_context__.s(['EQUIPMENT_OWNER_OPTIONS', () => EQUIPMENT_OWNER_OPTIONS]);
    const EQUIPMENT_OWNER_OPTIONS = [
      {
        value: 'safety_team',
        i18nKey: 'ownerSafetyTeam',
      },
      {
        value: 'battery_team',
        i18nKey: 'ownerBatteryTeam',
      },
      {
        value: 'other',
        i18nKey: 'ownerOther',
      },
    ];
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/data-scope.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * ============================================================================
     * 🔴 SSOT: DataScope Policy Pattern
     * ============================================================================
     *
     * 역할별 데이터 접근 범위(스코프)를 정책 객체로 선언합니다.
     * 백엔드/프론트엔드 모두 이 파일에서 import하여 사용합니다.
     *
     * 기존 문제: 백엔드 7곳에서 역할→스코프 매핑을 인라인 하드코딩
     * 해결: 정책(Policy) + 해석기(Resolver) 분리 → switch/if 제거
     *
     * 확장: 향후 EQUIPMENT_DATA_SCOPE, CHECKOUT_DATA_SCOPE 등 추가 가능
     * ============================================================================
     */ __turbopack_context__.s([
      'AUDIT_LOG_SCOPE',
      () => AUDIT_LOG_SCOPE,
      'CALIBRATION_DATA_SCOPE',
      () => CALIBRATION_DATA_SCOPE,
      'CALIBRATION_PLAN_DATA_SCOPE',
      () => CALIBRATION_PLAN_DATA_SCOPE,
      'CHECKOUT_DATA_SCOPE',
      () => CHECKOUT_DATA_SCOPE,
      'EQUIPMENT_DATA_SCOPE',
      () => EQUIPMENT_DATA_SCOPE,
      'EQUIPMENT_IMPORT_DATA_SCOPE',
      () => EQUIPMENT_IMPORT_DATA_SCOPE,
      'NON_CONFORMANCE_DATA_SCOPE',
      () => NON_CONFORMANCE_DATA_SCOPE,
      'NOTIFICATION_DATA_SCOPE',
      () => NOTIFICATION_DATA_SCOPE,
      'SOFTWARE_DATA_SCOPE',
      () => SOFTWARE_DATA_SCOPE,
      'USER_DATA_SCOPE',
      () => USER_DATA_SCOPE,
      'resolveDataScope',
      () => resolveDataScope,
    ]);
    const AUDIT_LOG_SCOPE = {
      test_engineer: {
        type: 'none',
        label: '접근 불가',
      },
      technical_manager: {
        type: 'team',
        label: '소속 팀 활동 기록',
      },
      quality_manager: {
        type: 'all',
        label: '전체 활동 기록',
      },
      lab_manager: {
        type: 'site',
        label: '소속 사이트 활동 기록',
      },
      system_admin: {
        type: 'all',
        label: '전체 활동 기록',
      },
    };
    const EQUIPMENT_DATA_SCOPE = {
      test_engineer: {
        type: 'site',
        label: '소속 사이트 장비',
      },
      technical_manager: {
        type: 'all',
        label: '전체 장비',
      },
      quality_manager: {
        type: 'all',
        label: '전체 장비',
      },
      lab_manager: {
        type: 'all',
        label: '전체 장비',
      },
      system_admin: {
        type: 'all',
        label: '전체 장비',
      },
    };
    const CHECKOUT_DATA_SCOPE = {
      test_engineer: {
        type: 'team',
        label: '소속 팀 반출',
      },
      technical_manager: {
        type: 'team',
        label: '소속 팀 반출',
      },
      quality_manager: {
        type: 'site',
        label: '소속 사이트 반출',
      },
      lab_manager: {
        type: 'site',
        label: '소속 사이트 반출',
      },
      system_admin: {
        type: 'all',
        label: '전체 반출',
      },
    };
    const NON_CONFORMANCE_DATA_SCOPE = {
      test_engineer: {
        type: 'site',
        label: '소속 사이트 부적합',
      },
      technical_manager: {
        type: 'site',
        label: '소속 사이트 부적합',
      },
      quality_manager: {
        type: 'site',
        label: '소속 사이트 부적합',
      },
      lab_manager: {
        type: 'all',
        label: '전체 부적합',
      },
      system_admin: {
        type: 'all',
        label: '전체 부적합',
      },
    };
    const CALIBRATION_DATA_SCOPE = {
      test_engineer: {
        type: 'site',
        label: '소속 사이트 교정 기록',
      },
      technical_manager: {
        type: 'site',
        label: '소속 사이트 교정 기록',
      },
      quality_manager: {
        type: 'all',
        label: '전체 교정 기록',
      },
      lab_manager: {
        type: 'all',
        label: '전체 교정 기록',
      },
      system_admin: {
        type: 'all',
        label: '전체 교정 기록',
      },
    };
    const EQUIPMENT_IMPORT_DATA_SCOPE = {
      test_engineer: {
        type: 'site',
        label: '소속 사이트 반입 기록',
      },
      technical_manager: {
        type: 'site',
        label: '소속 사이트 반입 기록',
      },
      quality_manager: {
        type: 'site',
        label: '소속 사이트 반입 기록',
      },
      lab_manager: {
        type: 'all',
        label: '전체 반입 기록',
      },
      system_admin: {
        type: 'all',
        label: '전체 반입 기록',
      },
    };
    const CALIBRATION_PLAN_DATA_SCOPE = {
      test_engineer: {
        type: 'site',
        label: '소속 사이트 교정계획서',
      },
      technical_manager: {
        type: 'site',
        label: '소속 사이트 교정계획서',
      },
      quality_manager: {
        type: 'all',
        label: '전체 교정계획서',
      },
      lab_manager: {
        type: 'all',
        label: '전체 교정계획서',
      },
      system_admin: {
        type: 'all',
        label: '전체 교정계획서',
      },
    };
    const SOFTWARE_DATA_SCOPE = {
      test_engineer: {
        type: 'site',
        label: '소속 사이트 소프트웨어',
      },
      technical_manager: {
        type: 'all',
        label: '전체 소프트웨어',
      },
      quality_manager: {
        type: 'all',
        label: '전체 소프트웨어',
      },
      lab_manager: {
        type: 'all',
        label: '전체 소프트웨어',
      },
      system_admin: {
        type: 'all',
        label: '전체 소프트웨어',
      },
    };
    const USER_DATA_SCOPE = {
      test_engineer: {
        type: 'site',
        label: '소속 사이트 사용자',
      },
      technical_manager: {
        type: 'site',
        label: '소속 사이트 사용자',
      },
      quality_manager: {
        type: 'all',
        label: '전체 사용자',
      },
      lab_manager: {
        type: 'all',
        label: '전체 사용자',
      },
      system_admin: {
        type: 'all',
        label: '전체 사용자',
      },
    };
    const NOTIFICATION_DATA_SCOPE = {
      test_engineer: {
        type: 'none',
        label: '접근 불가',
      },
      technical_manager: {
        type: 'site',
        label: '소속 사이트 알림',
      },
      quality_manager: {
        type: 'site',
        label: '소속 사이트 알림',
      },
      lab_manager: {
        type: 'site',
        label: '소속 사이트 알림',
      },
      system_admin: {
        type: 'all',
        label: '전체 알림',
      },
    };
    function resolveDataScope(user, policy) {
      const p = policy[user.role];
      if (!p || p.type === 'none') {
        return {
          type: 'none',
          label: p?.label ?? '접근 불가',
        };
      }
      switch (p.type) {
        case 'team':
          return {
            type: 'team',
            teamId: user.teamId,
            label: p.label,
          };
        case 'site':
          return {
            type: 'site',
            site: user.site,
            label: p.label,
          };
        case 'all':
          return {
            type: 'all',
            label: p.label,
          };
      }
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([]);
    /**
     * @equipment-management/shared-constants
     *
     * 공유 상수 패키지 - SSOT (Single Source of Truth)
     *
     * 이 패키지는 백엔드/프론트엔드 간 공유되는 상수들의 단일 소스입니다.
     * - 역할 (Roles): @equipment-management/schemas에서 re-export
     * - 권한 (Permissions): 이 패키지에서 정의
     * - 역할-권한 매핑 (Role-Permissions): 이 패키지에서 정의
     * - API 엔드포인트: 이 패키지에서 정의
     * - 인증 토큰 라이프사이클: auth-token.ts에서 정의 (FE/BE 공유)
     */ // 인증 토큰 라이프사이클 상수 (프론트엔드 NextAuth + 백엔드 JWT 공유)
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/auth-token.ts [app-client] (ecmascript)'
      );
    // 역할 관련
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$roles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/roles.ts [app-client] (ecmascript) <locals>'
      );
    // 권한 관련
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/permissions.ts [app-client] (ecmascript)'
      );
    // 역할-권한 매핑
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$role$2d$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/role-permissions.ts [app-client] (ecmascript)'
      );
    // 권한 카테고리
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$permission$2d$categories$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/permission-categories.ts [app-client] (ecmascript)'
      );
    // API 엔드포인트
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$api$2d$endpoints$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/api-endpoints.ts [app-client] (ecmascript)'
      );
    // 프론트엔드 라우트
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$frontend$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/frontend-routes.ts [app-client] (ecmascript)'
      );
    // 반출 목적별 장비 선택 가능성 규칙
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$checkout$2d$selectability$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/checkout-selectability.ts [app-client] (ecmascript)'
      );
    // 반출 목적 배지 스타일
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$checkout$2d$purpose$2d$styles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/checkout-purpose-styles.ts [app-client] (ecmascript)'
      );
    // 사이트 필터 옵션
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$site$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/site-options.ts [app-client] (ecmascript)'
      );
    // 알림 카테고리
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$notification$2d$categories$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/notification-categories.ts [app-client] (ecmascript)'
      );
    // 엔티티 라우팅
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$entity$2d$routes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/entity-routes.ts [app-client] (ecmascript)'
      );
    // 캐시 TTL (Backend SimpleCacheService + Frontend React Query 공유)
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$cache$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/cache-config.ts [app-client] (ecmascript)'
      );
    // 승인 KPI 상수 (긴급 임계값 등)
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$approval$2d$kpi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/approval-kpi.ts [app-client] (ecmascript)'
      );
    // 공용장비 소유처 옵션
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$equipment$2d$owner$2d$options$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/equipment-owner-options.ts [app-client] (ecmascript)'
      );
    // 데이터 스코프 정책 (역할별 접근 범위)
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$data$2d$scope$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/data-scope.ts [app-client] (ecmascript)'
      );
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * React Query 캐시 설정 - Single Source of Truth
     *
     * 모든 React Query 훅에서 참조하는 중앙화된 캐시 설정입니다.
     * staleTime, gcTime 등의 설정을 일관되게 관리합니다.
     *
     * 용어 정리:
     * - staleTime: 데이터가 "신선"하다고 간주되는 시간 (이 시간 동안 refetch 안 함)
     * - gcTime: 캐시에서 데이터가 유지되는 시간 (garbage collection time)
     *
     * Architecture v2 (2026-02-16):
     * - Data Fetching Strategy: Real-time 요구사항 4단계 분류
     * - SSOT: REFETCH_STRATEGIES로 중앙화된 갱신 전략
     * - Visual Feedback: Urgency Level과 분리 (Design Token으로 이동)
     */ __turbopack_context__.s([
      'CACHE_TIMES',
      () => CACHE_TIMES,
      'QUERY_CONFIG',
      () => QUERY_CONFIG,
      'REFETCH_INTERVALS',
      () => REFETCH_INTERVALS,
      'REFETCH_STRATEGIES',
      () => REFETCH_STRATEGIES,
      'queryKeys',
      () => queryKeys,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$cache$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/cache-config.ts [app-client] (ecmascript)'
      );
    const CACHE_TIMES =
      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$cache$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'CACHE_TTL'
      ];
    const REFETCH_INTERVALS = {
      /** 30초 - 실시간 중요 데이터 (알림, 채팅) */ REALTIME: 30 * 1000,
      /** 2분 - 준실시간 데이터 (대시보드 통계) */ NEAR_REALTIME: 2 * 60 * 1000,
      /** 5분 - 주기적 갱신 (모니터링) */ PERIODIC: 5 * 60 * 1000,
      /** 없음 - 사용자 인터랙션 기반 갱신 */ NONE: undefined,
    };
    const REFETCH_STRATEGIES = {
      /** 실시간 (SSE 추천, 현재: 30초 폴링) */ CRITICAL: {
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
        refetchInterval: REFETCH_INTERVALS.REALTIME,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 준실시간 (2분 폴링) */ IMPORTANT: {
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
        refetchInterval: REFETCH_INTERVALS.NEAR_REALTIME,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 사용자 인터랙션 기반 (window focus만) */ NORMAL: {
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
        refetchInterval: REFETCH_INTERVALS.NONE,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 정적 (수동 갱신) */ STATIC: {
        staleTime: CACHE_TIMES.REFERENCE,
        gcTime: CACHE_TIMES.REFERENCE,
        refetchInterval: REFETCH_INTERVALS.NONE,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    };
    const QUERY_CONFIG = {
      /** 장비 목록 - NORMAL (사용자 필터링 시 갱신) */ EQUIPMENT_LIST: {
        staleTime: CACHE_TIMES.LONG,
        gcTime: CACHE_TIMES.VERY_LONG,
        refetchOnWindowFocus: false,
        retry: 3,
      },
      /** 장비 상세 - NORMAL (mutation 후 자동 무효화) */ EQUIPMENT_DETAIL: {
        staleTime: CACHE_TIMES.MEDIUM,
        gcTime: CACHE_TIMES.LONG,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 대시보드 - NORMAL (탭 전환 시 갱신, 자동 폴링 없음) */ DASHBOARD:
        REFETCH_STRATEGIES.NORMAL,
      /** 교정 요약 통계 - NORMAL */ CALIBRATION_SUMMARY: REFETCH_STRATEGIES.NORMAL,
      /** 교정 이력 목록 - NORMAL */ CALIBRATION_LIST: {
        staleTime: CACHE_TIMES.LONG,
        gcTime: CACHE_TIMES.VERY_LONG,
        refetchOnWindowFocus: false,
        retry: 2,
      },
      /** 교정 계획 목록 - NORMAL */ CALIBRATION_PLANS: {
        staleTime: CACHE_TIMES.LONG,
        gcTime: CACHE_TIMES.VERY_LONG,
        refetchOnWindowFocus: false,
        retry: 2,
      },
      /** 교정 계획 상세 - NORMAL */ CALIBRATION_PLAN_DETAIL: {
        staleTime: CACHE_TIMES.MEDIUM,
        gcTime: CACHE_TIMES.LONG,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 알림 - CRITICAL (SSE 전환 전까지 30초 폴링) */ NOTIFICATIONS: REFETCH_STRATEGIES.CRITICAL,
      /** 팀 목록 - STATIC (거의 변경 없음) */ TEAMS: REFETCH_STRATEGIES.STATIC,
      /** 사용자 목록 - NORMAL */ USERS: {
        staleTime: CACHE_TIMES.LONG,
        gcTime: CACHE_TIMES.VERY_LONG,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 이력 데이터 - NORMAL */ HISTORY: {
        staleTime: CACHE_TIMES.MEDIUM,
        gcTime: CACHE_TIMES.LONG,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 승인 대기 목록 - NORMAL (SSE로 무효화 예정) */ PENDING_APPROVALS:
        REFETCH_STRATEGIES.NORMAL,
      /** 사용자 설정 - STATIC (mutation onSettled invalidation으로만 갱신) */ SETTINGS:
        REFETCH_STRATEGIES.STATIC,
      /** 감사 로그 목록 - append-only, 사용자 명시적 갱신 기반 (window focus 갱신 없음) */ AUDIT_LOGS:
        {
          staleTime: CACHE_TIMES.LONG,
          gcTime: CACHE_TIMES.VERY_LONG,
          refetchOnWindowFocus: false,
          retry: 2,
        },
      /** 부적합 관리 목록 - NORMAL (상태 변경 후 무효화로 갱신) */ NON_CONFORMANCES_LIST: {
        staleTime: CACHE_TIMES.LONG,
        gcTime: CACHE_TIMES.VERY_LONG,
        refetchOnWindowFocus: false,
        retry: 2,
      },
      /** 부적합 관리 상세 - NORMAL (mutation 후 자동 무효화) */ NON_CONFORMANCES_DETAIL: {
        staleTime: CACHE_TIMES.MEDIUM,
        gcTime: CACHE_TIMES.LONG,
        refetchOnWindowFocus: true,
        retry: 2,
      },
      /** 소프트웨어 관리대장 - NORMAL (승인 후 무효화로 갱신) */ SOFTWARE_REGISTRY: {
        staleTime: CACHE_TIMES.LONG,
        gcTime: CACHE_TIMES.VERY_LONG,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    };
    const queryKeys = {
      equipment: {
        all: ['equipment'],
        lists: () => [...queryKeys.equipment.all, 'list'],
        list: (filters) => [...queryKeys.equipment.lists(), filters],
        search: (term) => [...queryKeys.equipment.all, 'search', term],
        checkoutSearch: (search, purpose, teamId) => [
          ...queryKeys.equipment.all,
          'checkout-search',
          search,
          purpose,
          teamId,
        ],
        details: () => [...queryKeys.equipment.all, 'detail'],
        detail: (id) => [...queryKeys.equipment.details(), id],
        history: (id, type) => [...queryKeys.equipment.detail(id), 'history', type],
        managementNumberCheck: (value, excludeId) => [
          ...queryKeys.equipment.all,
          'management-number-check',
          value,
          excludeId,
        ],
        // Sub-resources (nested under detail)
        nonConformances: (id) => [...queryKeys.equipment.detail(id), 'non-conformances'],
        openNonConformances: (id) => [...queryKeys.equipment.detail(id), 'open-non-conformances'],
        incidentHistory: (id) => [...queryKeys.equipment.detail(id), 'incident-history'],
        repairHistory: (id) => [...queryKeys.equipment.detail(id), 'repair-history'],
        locationHistory: (id) => [...queryKeys.equipment.detail(id), 'location-history'],
        maintenanceHistory: (id) => [...queryKeys.equipment.detail(id), 'maintenance-history'],
        checkoutHistory: (id) => [...queryKeys.equipment.detail(id), 'checkout-history'],
        calibrationFactors: (id) => [...queryKeys.equipment.detail(id), 'calibration-factors'],
        disposalRequests: (id) => [...queryKeys.equipment.detail(id), 'disposal-requests'],
        currentDisposalRequest: (id) => [
          ...queryKeys.equipment.detail(id),
          'disposal-request',
          'current',
        ],
      },
      calibrationPlans: {
        all: ['calibrationPlans'],
        lists: () => [...queryKeys.calibrationPlans.all, 'list'],
        list: (filters) => [...queryKeys.calibrationPlans.lists(), filters],
        details: () => [...queryKeys.calibrationPlans.all, 'detail'],
        detail: (id) => [...queryKeys.calibrationPlans.details(), id],
        pending: () => [...queryKeys.calibrationPlans.all, 'pending'],
        versions: (planId) => [...queryKeys.calibrationPlans.detail(planId), 'versions'],
        externalEquipment: (year, site, teamId) => [
          ...queryKeys.calibrationPlans.all,
          'external-equipment',
          year,
          site,
          teamId,
        ],
      },
      calibrationFactors: {
        all: ['calibration-factors'],
        lists: () => [...queryKeys.calibrationFactors.all, 'list'],
        byEquipment: (equipmentId) => [
          ...queryKeys.calibrationFactors.all,
          'equipment',
          equipmentId,
        ],
        allByEquipment: (equipmentId) => [
          ...queryKeys.calibrationFactors.all,
          'all-by-equipment',
          equipmentId,
        ],
        pending: () => [...queryKeys.calibrationFactors.all, 'pending'],
        registry: () => [...queryKeys.calibrationFactors.all, 'registry'],
      },
      dashboard: {
        all: ['dashboard'],
        aggregate: (role, teamId) => [...queryKeys.dashboard.all, 'aggregate', role, teamId],
        summary: (role, teamId) => [...queryKeys.dashboard.all, 'summary', role, teamId],
        equipmentByTeam: (role, teamId) => [
          ...queryKeys.dashboard.all,
          'equipmentByTeam',
          role,
          teamId,
        ],
        overdueCalibrations: (role, teamId) => [
          ...queryKeys.dashboard.all,
          'overdueCalibrations',
          role,
          teamId,
        ],
        upcomingCalibrations: (role, teamId) => [
          ...queryKeys.dashboard.all,
          'upcomingCalibrations',
          role,
          teamId,
        ],
        overdueCheckouts: (role, teamId) => [
          ...queryKeys.dashboard.all,
          'overdueCheckouts',
          role,
          teamId,
        ],
        recentActivities: (role, teamId) => [
          ...queryKeys.dashboard.all,
          'recentActivities',
          role,
          teamId,
        ],
        equipmentStatusStats: (role, teamId) => [
          ...queryKeys.dashboard.all,
          'equipmentStatusStats',
          role,
          teamId,
        ],
        pendingApprovalCounts: (role) => [
          ...queryKeys.dashboard.all,
          'pendingApprovalCounts',
          role,
        ],
      },
      teams: {
        all: ['teams'],
        lists: () => [...queryKeys.teams.all, 'list'],
        list: (filters) => [...queryKeys.teams.lists(), filters],
        detail: (id) => [...queryKeys.teams.all, 'detail', id],
        members: (teamId) => [...queryKeys.teams.detail(teamId), 'members'],
        filterOptions: (site) => [...queryKeys.teams.all, 'filter-options', site],
        bySite: (site) => [...queryKeys.teams.all, 'by-site', site],
      },
      users: {
        all: ['users'],
        list: () => [...queryKeys.users.all, 'list'],
        detail: (id) => [...queryKeys.users.all, 'detail', id],
        search: (params) => [...queryKeys.users.all, 'search', params],
      },
      notifications: {
        all: ['notifications'],
        list: (filters) => [...queryKeys.notifications.all, 'list', filters],
        unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'],
        preferences: () => [...queryKeys.notifications.all, 'preferences'],
      },
      nonConformances: {
        all: ['non-conformances'],
        lists: () => [...queryKeys.nonConformances.all, 'list'],
        list: (filters) => [...queryKeys.nonConformances.lists(), filters],
        detail: (id) => [...queryKeys.nonConformances.all, 'detail', id],
        byEquipment: (equipmentId) => [...queryKeys.nonConformances.all, 'equipment', equipmentId],
      },
      disposal: {
        all: ['disposal-requests'],
        lists: () => [...queryKeys.disposal.all, 'list'],
        list: (filters) => [...queryKeys.disposal.lists(), filters],
        detail: (id) => [...queryKeys.disposal.all, 'detail', id],
      },
      checkouts: {
        all: ['checkouts'],
        lists: () => [...queryKeys.checkouts.all, 'list'],
        list: (filters) => [...queryKeys.checkouts.lists(), filters],
        detail: (id) => [...queryKeys.checkouts.all, 'detail', id],
        byEquipment: (equipmentId) => [...queryKeys.checkouts.all, 'equipment', equipmentId],
        outbound: (teamId, status, location) => [
          ...queryKeys.checkouts.all,
          'outbound',
          teamId,
          status,
          location,
        ],
        inbound: (filters = {}) => [...queryKeys.checkouts.all, 'inbound', filters],
        destinations: () => [...queryKeys.checkouts.all, 'destinations'],
        pending: () => [...queryKeys.checkouts.all, 'pending'],
        returnPending: () => [...queryKeys.checkouts.all, 'return-pending'],
        summary: (params = {}) => [...queryKeys.checkouts.all, 'summary', params],
      },
      calibrations: {
        all: ['calibrations'],
        summary: (teamId, site) =>
          teamId || site
            ? [
                ...queryKeys.calibrations.all,
                'summary',
                {
                  teamId,
                  site,
                },
              ]
            : [...queryKeys.calibrations.all, 'summary'],
        overdue: (teamId, site) =>
          teamId || site
            ? [
                ...queryKeys.calibrations.all,
                'overdue',
                {
                  teamId,
                  site,
                },
              ]
            : [...queryKeys.calibrations.all, 'overdue'],
        upcoming: (days, teamId, site) =>
          teamId || site
            ? [
                ...queryKeys.calibrations.all,
                'upcoming',
                days,
                {
                  teamId,
                  site,
                },
              ]
            : [...queryKeys.calibrations.all, 'upcoming', days],
        historyList: (filters) => [...queryKeys.calibrations.all, 'history', filters],
        pending: () => [...queryKeys.calibrations.all, 'pending'],
        byEquipment: (equipmentId) => [...queryKeys.calibrations.all, 'equipment', equipmentId],
        intermediateChecks: (teamId, site) =>
          teamId || site
            ? [
                ...queryKeys.calibrations.all,
                'intermediate-checks',
                {
                  teamId,
                  site,
                },
              ]
            : [...queryKeys.calibrations.all, 'intermediate-checks'],
      },
      reports: {
        all: ['reports'],
        equipmentUsage: (filters) => [...queryKeys.reports.all, 'equipment-usage', filters],
        calibrationStatus: (filters) => [...queryKeys.reports.all, 'calibration-status', filters],
        checkoutStatistics: (filters) => [...queryKeys.reports.all, 'checkout-statistics', filters],
        utilizationRate: (filters) => [...queryKeys.reports.all, 'utilization-rate', filters],
        equipmentDowntime: (filters) => [...queryKeys.reports.all, 'equipment-downtime', filters],
      },
      software: {
        all: ['software'],
        registry: () => [...queryKeys.software.all, 'registry'],
        byEquipment: (equipmentId) => [...queryKeys.software.all, equipmentId],
        history: (equipmentId) => [...queryKeys.software.all, 'history', equipmentId],
        pending: () => [...queryKeys.software.all, 'pending'],
      },
      equipmentImports: {
        all: ['equipment-imports'],
        lists: () => [...queryKeys.equipmentImports.all, 'list'],
        list: (filters) => [...queryKeys.equipmentImports.lists(), filters],
        detail: (id) => [...queryKeys.equipmentImports.all, 'detail', id],
        bySourceType: (sourceType, filters = {}) => [
          ...queryKeys.equipmentImports.all,
          sourceType,
          filters,
        ],
      },
      equipmentRequests: {
        all: ['equipment-requests'],
        lists: () => [...queryKeys.equipmentRequests.all, 'list'],
        pending: () => [...queryKeys.equipmentRequests.all, 'pending'],
        detail: (id) => [...queryKeys.equipmentRequests.all, 'detail', id],
      },
      approvals: {
        all: ['approvals'],
        list: (category, teamId) => [...queryKeys.approvals.all, category, teamId],
        /** SSOT: 네비 뱃지, 대시보드 카드, 승인 페이지 공용 */ counts: (role) => [
          'approval-counts',
          role,
        ],
        /** 역할 무관 prefix — 무효화 전용 (모든 role의 counts를 한번에 무효화) */ countsAll: [
          'approval-counts',
        ],
        /** 승인 KPI — 서버 사이드 집계 (카테고리별 urgentCount/avgWaitDays 포함) */ kpi: (
          category
        ) => [...queryKeys.approvals.all, 'kpi', category],
      },
      auditLogs: {
        all: ['audit-logs'],
        lists: () => [...queryKeys.auditLogs.all, 'list'],
        list: (filters) => [...queryKeys.auditLogs.lists(), filters],
        detail: (id) => [...queryKeys.auditLogs.all, 'detail', id],
      },
      settings: {
        all: ['settings'],
        profile: () => [...queryKeys.settings.all, 'profile'],
        preferences: () => [...queryKeys.settings.all, 'preferences'],
        calibration: (site) => [...queryKeys.settings.all, 'calibration', site],
        system: () => [...queryKeys.settings.all, 'system'],
      },
      breadcrumbs: {
        all: ['breadcrumb'],
        equipment: (id) => [...queryKeys.breadcrumbs.all, 'equipment', id],
        resource: (type, id) => [...queryKeys.breadcrumbs.all, type, id],
      },
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/utils/performance-errors.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * Performance API 에러 패턴 SSOT
     *
     * Next.js 16 PPR + Turbopack 환경에서 발생하는 Performance.measure() 에러를
     * 일관되게 감지하고 처리하기 위한 중앙화된 에러 패턴 정의
     *
     * @see {@link https://github.com/vercel/next.js/issues/86060}
     */ /**
     * Performance.measure() 음수 타임스탬프 에러 패턴
     *
     * SSOT: 모든 Performance 관련 에러 감지에서 이 패턴 사용
     */ __turbopack_context__.s([
      'PERFORMANCE_ERROR_PATTERNS',
      () => PERFORMANCE_ERROR_PATTERNS,
      'PERFORMANCE_ERROR_TYPES',
      () => PERFORMANCE_ERROR_TYPES,
      'isBrowserEnvironment',
      () => isBrowserEnvironment,
      'isDevelopmentEnvironment',
      () => isDevelopmentEnvironment,
      'isPerformanceMeasureError',
      () => isPerformanceMeasureError,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    const PERFORMANCE_ERROR_PATTERNS = {
      /**
       * 음수 타임스탬프 에러 메시지 패턴
       *
       * 발생 케이스:
       * - "cannot have a negative time stamp"
       * - "cannot have negative time stamp"
       * - "negative time stamp" (하위 호환)
       */ NEGATIVE_TIMESTAMP: /negative time stamp/i,
      /**
       * 유효하지 않은 마크 에러
       *
       * PPR 컴포넌트가 unmount된 후 measure 시도 시 발생
       */ INVALID_MARK: /mark .+ does not exist|mark .+ not found/i,
    };
    const PERFORMANCE_ERROR_TYPES = ['TypeError', 'DOMException'];
    function isPerformanceMeasureError(error) {
      if (!(error instanceof Error)) return false;
      // 타입 체크: TypeError 또는 DOMException
      const isValidType = PERFORMANCE_ERROR_TYPES.some((type) => error.name === type);
      if (!isValidType) return false;
      // 패턴 매칭: 음수 타임스탬프 또는 유효하지 않은 마크
      const message = error.message;
      return (
        PERFORMANCE_ERROR_PATTERNS.NEGATIVE_TIMESTAMP.test(message) ||
        PERFORMANCE_ERROR_PATTERNS.INVALID_MARK.test(message)
      );
    }
    function isDevelopmentEnvironment() {
      return ('TURBOPACK compile-time value', 'development') === 'development';
    }
    function isBrowserEnvironment() {
      return (
        ('TURBOPACK compile-time value', 'object') !== 'undefined' &&
        typeof performance !== 'undefined'
      );
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/utils/patch-performance-measure.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['patchPerformanceMeasure', () => patchPerformanceMeasure]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$performance$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/performance-errors.ts [app-client] (ecmascript)'
      );
    function patchPerformanceMeasure() {
      // 환경 검증: 개발 환경 + 브라우저에서만 실행
      if (
        !(0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$performance$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isDevelopmentEnvironment'
        ])() ||
        !(0,
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$performance$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isBrowserEnvironment'
        ])()
      ) {
        return;
      }
      // Performance.measure 존재 여부 확인
      if (typeof performance.measure !== 'function') {
        return;
      }
      const originalMeasure = performance.measure.bind(performance);
      /**
       * 패치된 Performance.measure (타입 안전, 에러 필터링)
       *
       * @param args - 원본 measure() 인자
       * @returns PerformanceMeasure 또는 noop measure
       * @throws 예상치 못한 에러만 재throw (PPR 에러는 무시)
       */ performance.measure = function patchedMeasure(...args) {
        try {
          return originalMeasure(...args);
        } catch (error) {
          // SSOT 에러 패턴 매칭: PPR 관련 에러만 무시
          if (
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$performance$2d$errors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isPerformanceMeasureError'
            ])(error)
          ) {
            // 개발 환경에서만 경고 로그 (프로덕션 로그 오염 방지)
            if (('TURBOPACK compile-time truthy', 1)) {
              const measureName = args[0];
              console.debug(
                `[Performance Patch] PPR measure skipped: "${measureName}"`,
                error instanceof Error ? error.message : error
              );
            }
            // API 계약 유지: 빈 PerformanceMeasure 반환
            // Note: '__ppr_noop__' 마크는 존재하지 않지만 무시됨 (fallback)
            try {
              return originalMeasure('__ppr_noop__');
            } catch {
              // Noop measure도 실패하면 undefined 반환 (극히 드문 케이스)
              // TypeScript는 PerformanceMeasure 기대하지만 실제로는 무시됨
              return undefined;
            }
          }
          // 예상치 못한 에러는 재throw (디버깅 가능하도록)
          throw error;
        }
      };
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/hooks/use-idle-timeout.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useIdleTimeout', () => useIdleTimeout]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/auth-token.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    /** scroll, touchstart는 passive 리스너로 등록하여 스크롤 성능 보호 */ const PASSIVE_EVENTS =
      new Set(['scroll', 'touchstart']);
    function useIdleTimeout() {
      _s();
      const { status } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSession'
      ])();
      const [isWarningVisible, setIsWarningVisible] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(false);
      const [secondsRemaining, setSecondsRemaining] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'IDLE_WARNING_BEFORE_SECONDS'
        ]
      );
      const lastActivityRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRef'
      ])(Date.now());
      const intervalRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRef'
      ])(null);
      const isWarningVisibleRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRef'
      ])(false);
      const resetTimer = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useIdleTimeout.useCallback[resetTimer]': () => {
            lastActivityRef.current = Date.now();
            if (isWarningVisibleRef.current) {
              isWarningVisibleRef.current = false;
              setIsWarningVisible(false);
              setSecondsRemaining(
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'IDLE_WARNING_BEFORE_SECONDS'
                ]
              );
            }
          },
        }['useIdleTimeout.useCallback[resetTimer]'],
        []
      );
      const handleLogout = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useIdleTimeout.useCallback[handleLogout]': () => {
            // interval 정리 — signOut 비동기 처리 중 반복 호출 방지
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // 로그아웃 흐름 일관성: use-auth.ts logout()과 동일하게 캐시 정리
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'clearTokenCache'
            ])();
            if (
              ('TURBOPACK compile-time value', 'object') !== 'undefined' &&
              'BroadcastChannel' in window
            ) {
              const ch = new BroadcastChannel(
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'SESSION_SYNC_CHANNEL'
                ]
              );
              ch.postMessage({
                type: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'SESSION_SYNC_MESSAGE'
                ].IDLE_LOGOUT,
              });
              ch.close();
            }
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'signOut'
            ])({
              callbackUrl: '/login',
            });
          },
        }['useIdleTimeout.useCallback[handleLogout]'],
        []
      );
      const handleContinue = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ])(
        {
          'useIdleTimeout.useCallback[handleContinue]': () => {
            resetTimer();
            if (
              ('TURBOPACK compile-time value', 'object') !== 'undefined' &&
              'BroadcastChannel' in window
            ) {
              const ch = new BroadcastChannel(
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'SESSION_SYNC_CHANNEL'
                ]
              );
              ch.postMessage({
                type: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'SESSION_SYNC_MESSAGE'
                ].ACTIVITY_RESET,
              });
              ch.close();
            }
          },
        }['useIdleTimeout.useCallback[handleContinue]'],
        [resetTimer]
      );
      // 활동 감지 + 타이머
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'useIdleTimeout.useEffect': () => {
            if (status !== 'authenticated') return;
            let lastThrottleTime = 0;
            const handleActivity = {
              'useIdleTimeout.useEffect.handleActivity': () => {
                const now = Date.now();
                if (
                  now - lastThrottleTime <
                  __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'IDLE_ACTIVITY_THROTTLE_MS'
                  ]
                )
                  return;
                lastThrottleTime = now;
                resetTimer();
              },
            }['useIdleTimeout.useEffect.handleActivity'];
            ACTIVITY_EVENTS.forEach(
              {
                'useIdleTimeout.useEffect': (evt) => {
                  const opts = PASSIVE_EVENTS.has(evt)
                    ? {
                        passive: true,
                      }
                    : undefined;
                  window.addEventListener(evt, handleActivity, opts);
                },
              }['useIdleTimeout.useEffect']
            );
            intervalRef.current = setInterval(
              {
                'useIdleTimeout.useEffect': () => {
                  const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
                  if (
                    elapsedSeconds >=
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'IDLE_TIMEOUT_SECONDS'
                    ]
                  ) {
                    handleLogout();
                    return;
                  }
                  const warningThreshold =
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'IDLE_TIMEOUT_SECONDS'
                    ] -
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'IDLE_WARNING_BEFORE_SECONDS'
                    ];
                  if (elapsedSeconds >= warningThreshold) {
                    if (!isWarningVisibleRef.current) {
                      isWarningVisibleRef.current = true;
                      setIsWarningVisible(true);
                    }
                    setSecondsRemaining(
                      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'IDLE_TIMEOUT_SECONDS'
                      ] - elapsedSeconds
                    );
                  } else if (isWarningVisibleRef.current) {
                    isWarningVisibleRef.current = false;
                    setIsWarningVisible(false);
                  }
                },
              }['useIdleTimeout.useEffect'],
              1_000
            );
            return {
              'useIdleTimeout.useEffect': () => {
                ACTIVITY_EVENTS.forEach(
                  {
                    'useIdleTimeout.useEffect': (evt) =>
                      window.removeEventListener(evt, handleActivity),
                  }['useIdleTimeout.useEffect']
                );
                if (intervalRef.current) clearInterval(intervalRef.current);
              },
            }['useIdleTimeout.useEffect'];
          },
        }['useIdleTimeout.useEffect'],
        [status, resetTimer, handleLogout]
      );
      // 다른 탭 "계속 사용" 수신 → 본 탭 타이머 리셋
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'useIdleTimeout.useEffect': () => {
            if (status !== 'authenticated') return;
            if (
              ('TURBOPACK compile-time value', 'object') === 'undefined' ||
              !('BroadcastChannel' in window)
            )
              return;
            const ch = new BroadcastChannel(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'SESSION_SYNC_CHANNEL'
              ]
            );
            ch.onmessage = {
              'useIdleTimeout.useEffect': (event) => {
                if (
                  event.data.type ===
                  __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'SESSION_SYNC_MESSAGE'
                  ].ACTIVITY_RESET
                )
                  resetTimer();
              },
            }['useIdleTimeout.useEffect'];
            return {
              'useIdleTimeout.useEffect': () => ch.close(),
            }['useIdleTimeout.useEffect'];
          },
        }['useIdleTimeout.useEffect'],
        [status, resetTimer]
      );
      return {
        isWarningVisible,
        secondsRemaining,
        handleContinue,
        handleLogout,
      };
    }
    _s(useIdleTimeout, 'XNnc7SMpCvkbXLcqq5m+yAP9ZpY=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSession'
        ],
      ];
    });
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/utils/date.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'DATE_FNS_LOCALES',
      () => DATE_FNS_LOCALES,
      'addDaysFromToday',
      () => addDaysFromToday,
      'daysBetween',
      () => daysBetween,
      'formatDate',
      () => formatDate,
      'formatDateTime',
      () => formatDateTime,
      'formatRelativeTime',
      () => formatRelativeTime,
      'formatShortDate',
      () => formatShortDate,
      'getCurrentDateTime',
      () => getCurrentDateTime,
      'getDateAfterDays',
      () => getDateAfterDays,
      'getDateBeforeDays',
      () => getDateBeforeDays,
      'isDateOverdue',
      () => isDateOverdue,
      'toDate',
      () => toDate,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/date-fns/format.js [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/date-fns/parseISO.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/date-fns/isValid.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$formatDistanceToNow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/date-fns/formatDistanceToNow.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$ko$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/date-fns/locale/ko.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$en$2d$US$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/date-fns/locale/en-US.js [app-client] (ecmascript)'
      );
    const DATE_FNS_LOCALES = {
      ko: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$ko$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'ko'
      ],
      en: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$en$2d$US$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'enUS'
      ],
    };
    function toDate(value) {
      if (!value) return null;
      if (value instanceof Date)
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isValid'
        ])(value)
          ? value
          : null;
      try {
        const parsed = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'parseISO'
        ])(value);
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isValid'
        ])(parsed)
          ? parsed
          : null;
      } catch {
        return null;
      }
    }
    function formatDate(date, formatStr, includeTime = false, dateFnsLocale) {
      if (!date) return '-';
      try {
        // Date 객체가 아니면 ISO 문자열로 간주하고 파싱
        const dateObj =
          date instanceof Date
            ? date
            : (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'parseISO'
              ])(date);
        // 유효한 날짜인지 확인
        if (
          !(0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isValid'
          ])(dateObj)
        )
          return '-';
        // formatStr이 제공되지 않은 경우 includeTime에 따라 기본 포맷 사용
        const defaultFormat = includeTime ? 'yyyy.MM.dd HH:mm' : 'yyyy.MM.dd';
        const locale =
          dateFnsLocale ??
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$ko$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ko'
          ];
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'format'
        ])(dateObj, formatStr || defaultFormat, {
          locale,
        });
      } catch (error) {
        console.error('Date formatting error:', error);
        return '-';
      }
    }
    function formatDateTime(date) {
      return formatDate(date, 'yyyy년 MM월 dd일 HH:mm');
    }
    function formatShortDate(date) {
      return formatDate(date, 'yy.MM.dd');
    }
    function formatRelativeTime(date, dateFnsLocale) {
      if (!date) return '-';
      try {
        const dateObj =
          date instanceof Date
            ? date
            : (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'parseISO'
              ])(date);
        if (
          !(0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isValid'
          ])(dateObj)
        )
          return '-';
        const locale =
          dateFnsLocale ??
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$ko$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ko'
          ];
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$formatDistanceToNow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'formatDistanceToNow'
        ])(dateObj, {
          addSuffix: true,
          locale,
        });
      } catch {
        return '-';
      }
    }
    function addDaysFromToday(days) {
      const today = new Date();
      return new Date(today.setDate(today.getDate() + days));
    }
    function daysBetween(date1, date2 = new Date()) {
      try {
        const d1 =
          date1 instanceof Date
            ? date1
            : (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'parseISO'
              ])(date1);
        const d2 =
          date2 instanceof Date
            ? date2
            : (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'parseISO'
              ])(date2);
        // 유효한 날짜인지 확인
        if (
          !(0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isValid'
          ])(d1) ||
          !(0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isValid'
          ])(d2)
        )
          return 0;
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (error) {
        console.error('Date calculation error:', error);
        return 0;
      }
    }
    function getDateAfterDays(days) {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);
      return futureDate.toISOString().split('T')[0];
    }
    function getDateBeforeDays(days) {
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - days);
      return pastDate.toISOString().split('T')[0];
    }
    function isDateOverdue(dateString) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정
      const targetDate = new Date(dateString);
      targetDate.setHours(0, 0, 0, 0); // 비교 날짜도 자정으로 설정
      return targetDate < today;
    }
    function getCurrentDateTime() {
      return new Date().toISOString();
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'addDays',
      () => addDays,
      'capitalizeFirstLetter',
      () => capitalizeFirstLetter,
      'cn',
      () => cn,
      'formatCurrency',
      () => formatCurrency,
      'getRentalStatusColor',
      () => getRentalStatusColor,
      'truncateString',
      () => truncateString,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)'
      );
    // Re-export date utilities for compatibility
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/date.ts [app-client] (ecmascript)'
      );
    function cn(...inputs) {
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'twMerge'
      ])(
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'clsx'
        ])(inputs)
      );
    }
    function formatCurrency(amount) {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(amount);
    }
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function truncateString(str, maxLength) {
      if (str.length <= maxLength) return str;
      return str.slice(0, maxLength) + '...';
    }
    function getRentalStatusColor(status) {
      const statusColorMap = {
        pending: 'bg-brand-warning/10 text-brand-warning',
        approved: 'bg-brand-ok/10 text-brand-ok',
        rejected: 'bg-brand-critical/10 text-brand-critical',
        borrowed: 'bg-brand-info/10 text-brand-info',
        returned: 'bg-brand-neutral/10 text-brand-neutral',
        overdue: 'bg-brand-repair/10 text-brand-repair',
        return_requested: 'bg-brand-purple/10 text-brand-purple',
      };
      return statusColorMap[status] ?? 'bg-brand-neutral/10 text-brand-neutral';
    }
    function addDays(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Button', () => Button, 'buttonVariants', () => buttonVariants]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    const buttonVariants = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'cva'
    ])(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium motion-safe:transition-[background-color,border-color,color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
      {
        variants: {
          variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline:
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
          },
          size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10',
          },
        },
        defaultVariants: {
          variant: 'default',
          size: 'default',
        },
      }
    );
    const Button =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, variant, size, asChild = false, ...props }, ref) => {
          const Comp = asChild
            ? __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Slot'
              ]
            : 'button';
          return /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            Comp,
            {
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                buttonVariants({
                  variant,
                  size,
                  className,
                })
              ),
              ref: ref,
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/button.tsx',
              lineNumber: 42,
              columnNumber: 7,
            },
            ('TURBOPACK compile-time value', void 0)
          );
        })
      );
    _c1 = Button;
    Button.displayName = 'Button';
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'Button$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'Button');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/alert-dialog.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'AlertDialog',
      () => AlertDialog,
      'AlertDialogAction',
      () => AlertDialogAction,
      'AlertDialogCancel',
      () => AlertDialogCancel,
      'AlertDialogContent',
      () => AlertDialogContent,
      'AlertDialogDescription',
      () => AlertDialogDescription,
      'AlertDialogFooter',
      () => AlertDialogFooter,
      'AlertDialogHeader',
      () => AlertDialogHeader,
      'AlertDialogOverlay',
      () => AlertDialogOverlay,
      'AlertDialogPortal',
      () => AlertDialogPortal,
      'AlertDialogTitle',
      () => AlertDialogTitle,
      'AlertDialogTrigger',
      () => AlertDialogTrigger,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-alert-dialog/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    ('use client');
    const AlertDialog =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ];
    const AlertDialogTrigger =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Trigger'
      ];
    const AlertDialogPortal =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Portal'
      ];
    const AlertDialogOverlay =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](({ className, ...props }, ref) =>
        /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxDEV'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Overlay'
          ],
          {
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
              'cn'
            ])(
              'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              className
            ),
            ...props,
            ref: ref,
          },
          void 0,
          false,
          {
            fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
            lineNumber: 19,
            columnNumber: 3,
          },
          ('TURBOPACK compile-time value', void 0)
        )
      );
    _c = AlertDialogOverlay;
    AlertDialogOverlay.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Overlay'
      ].displayName;
    const AlertDialogContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c1 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            AlertDialogPortal,
            {
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  AlertDialogOverlay,
                  {},
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
                    lineNumber: 35,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Content'
                  ],
                  {
                    ref: ref,
                    className: (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                      'cn'
                    ])(
                      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                      className
                    ),
                    ...props,
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
                    lineNumber: 36,
                    columnNumber: 5,
                  },
                  ('TURBOPACK compile-time value', void 0)
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
              lineNumber: 34,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c2 = AlertDialogContent;
    AlertDialogContent.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Content'
      ].displayName;
    const AlertDialogHeader = ({ className, ...props }) =>
      /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex flex-col space-y-2 text-center sm:text-left', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
          lineNumber: 52,
          columnNumber: 3,
        },
        ('TURBOPACK compile-time value', void 0)
      );
    _c3 = AlertDialogHeader;
    AlertDialogHeader.displayName = 'AlertDialogHeader';
    const AlertDialogFooter = ({ className, ...props }) =>
      /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
            'cn'
          ])('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className),
          ...props,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
          lineNumber: 66,
          columnNumber: 3,
        },
        ('TURBOPACK compile-time value', void 0)
      );
    _c4 = AlertDialogFooter;
    AlertDialogFooter.displayName = 'AlertDialogFooter';
    const AlertDialogTitle =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c5 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Title'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-lg font-semibold', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
              lineNumber: 80,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c6 = AlertDialogTitle;
    AlertDialogTitle.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Title'
      ].displayName;
    const AlertDialogDescription =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c7 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Description'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-sm text-muted-foreground', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
              lineNumber: 92,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c8 = AlertDialogDescription;
    AlertDialogDescription.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Description'
      ].displayName;
    const AlertDialogAction =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c9 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Action'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'buttonVariants'
                ])(),
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
              lineNumber: 105,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c10 = AlertDialogAction;
    AlertDialogAction.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Action'
      ].displayName;
    const AlertDialogCancel =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c11 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Cancel'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'buttonVariants'
                ])({
                  variant: 'outline',
                }),
                'mt-2 sm:mt-0',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/alert-dialog.tsx',
              lineNumber: 117,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c12 = AlertDialogCancel;
    AlertDialogCancel.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$alert$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Cancel'
      ].displayName;
    var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12;
    __turbopack_context__.k.register(_c, 'AlertDialogOverlay');
    __turbopack_context__.k.register(_c1, 'AlertDialogContent$React.forwardRef');
    __turbopack_context__.k.register(_c2, 'AlertDialogContent');
    __turbopack_context__.k.register(_c3, 'AlertDialogHeader');
    __turbopack_context__.k.register(_c4, 'AlertDialogFooter');
    __turbopack_context__.k.register(_c5, 'AlertDialogTitle$React.forwardRef');
    __turbopack_context__.k.register(_c6, 'AlertDialogTitle');
    __turbopack_context__.k.register(_c7, 'AlertDialogDescription$React.forwardRef');
    __turbopack_context__.k.register(_c8, 'AlertDialogDescription');
    __turbopack_context__.k.register(_c9, 'AlertDialogAction$React.forwardRef');
    __turbopack_context__.k.register(_c10, 'AlertDialogAction');
    __turbopack_context__.k.register(_c11, 'AlertDialogCancel$React.forwardRef');
    __turbopack_context__.k.register(_c12, 'AlertDialogCancel');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/primitives.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * Design Token Primitives (Layer 1: Foundation)
     *
     * 디자인 시스템의 가장 낮은 레벨 - 절대값만 정의합니다.
     * 이 값들은 직접 사용하지 않고, semantic tokens에서 참조합니다.
     *
     * SSOT: 모든 크기, 색상, 간격의 원시값은 여기서만 정의
     * 변경 시: 전체 시스템이 자동으로 업데이트됨
     */ /**
     * Size Primitives (픽셀 기반)
     *
     * 반응형 전략:
     * - mobile: < 768px (Tailwind 'md' breakpoint)
     * - desktop: ≥ 768px
     */ __turbopack_context__.s([
      'ELEVATION_PRIMITIVES',
      () => ELEVATION_PRIMITIVES,
      'MOTION_PRIMITIVES',
      () => MOTION_PRIMITIVES,
      'RADIUS_PRIMITIVES',
      () => RADIUS_PRIMITIVES,
      'SIZE_PRIMITIVES',
      () => SIZE_PRIMITIVES,
      'SPACING_PRIMITIVES',
      () => SPACING_PRIMITIVES,
      'TYPOGRAPHY_PRIMITIVES',
      () => TYPOGRAPHY_PRIMITIVES,
      'toTailwindDuration',
      () => toTailwindDuration,
      'toTailwindGap',
      () => toTailwindGap,
      'toTailwindSize',
      () => toTailwindSize,
    ]);
    const SIZE_PRIMITIVES = {
      /** 터치 타겟 크기 (WCAG AAA: 최소 44x44px) */ touch: {
        minimal: {
          mobile: 44,
          desktop: 40,
        },
        comfortable: {
          mobile: 48,
          desktop: 44,
        },
        generous: {
          mobile: 56,
          desktop: 48,
        },
      },
      /** 아이콘 크기 */ icon: {
        xs: {
          mobile: 14,
          desktop: 12,
        },
        sm: {
          mobile: 16,
          desktop: 14,
        },
        md: {
          mobile: 20,
          desktop: 18,
        },
        lg: {
          mobile: 24,
          desktop: 20,
        },
        xl: {
          mobile: 28,
          desktop: 24,
        },
      },
      /** 아바타/프로필 이미지 */ avatar: {
        xs: {
          mobile: 24,
          desktop: 20,
        },
        sm: {
          mobile: 32,
          desktop: 28,
        },
        md: {
          mobile: 40,
          desktop: 36,
        },
        lg: {
          mobile: 48,
          desktop: 44,
        },
        xl: {
          mobile: 64,
          desktop: 56,
        },
      },
      /** 배지/인디케이터 */ badge: {
        sm: {
          mobile: 16,
          desktop: 14,
        },
        md: {
          mobile: 20,
          desktop: 18,
        },
        lg: {
          mobile: 24,
          desktop: 20,
        },
      },
    };
    const SPACING_PRIMITIVES = {
      /** 요소 간 간격 */ gap: {
        tight: {
          mobile: 8,
          desktop: 6,
        },
        comfortable: {
          mobile: 12,
          desktop: 8,
        },
        relaxed: {
          mobile: 16,
          desktop: 12,
        },
        spacious: {
          mobile: 24,
          desktop: 16,
        },
      },
      /** 내부 여백 */ padding: {
        compact: {
          mobile: 8,
          desktop: 6,
        },
        comfortable: {
          mobile: 12,
          desktop: 10,
        },
        relaxed: {
          mobile: 16,
          desktop: 14,
        },
      },
    };
    const MOTION_PRIMITIVES = {
      /** 지속 시간 (ms) */ duration: {
        instant: 100,
        fast: 200,
        moderate: 300,
        slow: 500,
        deliberate: 700,
      },
      /** Easing 곡선 */ easing: {
        /** 표준 전환 - 대부분의 애니메이션 */ standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        /** 가속 - 요소가 화면 밖으로 나갈 때 */ accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        /** 감속 - 요소가 화면 안으로 들어올 때 */ decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        /** 스프링 - 주목을 끄는 애니메이션 */ spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        /** 샤프 - 빠르고 날카로운 전환 */ sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      /** Stagger delay (연속 애니메이션 간격) */ stagger: {
        tight: 40,
        comfortable: 60,
        relaxed: 100,
      },
    };
    const ELEVATION_PRIMITIVES = {
      /** Z-index 레이어 */ zIndex: {
        base: 0,
        raised: 10,
        dropdown: 20,
        sticky: 30,
        overlay: 40,
        modal: 50,
        popover: 60,
        toast: 70,
      },
      /** Shadow 깊이 */ shadow: {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
    };
    const RADIUS_PRIMITIVES = {
      none: 0,
      sm: 4,
      md: 6,
      lg: 8,
      xl: 12,
      '2xl': 16,
      full: 9999,
    };
    const TYPOGRAPHY_PRIMITIVES = {
      fontSize: {
        xs: {
          mobile: 12,
          desktop: 11,
        },
        sm: {
          mobile: 14,
          desktop: 13,
        },
        base: {
          mobile: 16,
          desktop: 15,
        },
        lg: {
          mobile: 18,
          desktop: 17,
        },
        xl: {
          mobile: 20,
          desktop: 19,
        },
        '2xl': {
          mobile: 24,
          desktop: 22,
        },
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
      },
    };
    function toTailwindSize(value, property) {
      const mobileTailwind = pxToTailwind(value.mobile);
      const desktopTailwind = pxToTailwind(value.desktop);
      return `${property}-${mobileTailwind} md:${property}-${desktopTailwind}`;
    }
    /**
     * Utility: px를 Tailwind 숫자로 변환
     *
     * Tailwind: 1 unit = 0.25rem = 4px
     * 44px → 11 (44 / 4)
     */ function pxToTailwind(px) {
      const rem = px / 4;
      // Tailwind가 지원하는 값인지 확인 (0.5, 1, 1.5, 2, ... 100)
      if (Number.isInteger(rem) || rem % 0.5 === 0) {
        return rem;
      }
      // 지원하지 않는 값은 px 직접 사용
      return `[${px}px]`;
    }
    function toTailwindGap(value) {
      const mobileTailwind = pxToTailwind(value.mobile);
      const desktopTailwind = pxToTailwind(value.desktop);
      return `gap-${mobileTailwind} md:gap-${desktopTailwind}`;
    }
    function toTailwindDuration(ms) {
      return `duration-${ms}`;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'CONTENT_TOKENS',
      () => CONTENT_TOKENS,
      'ELEVATION_TOKENS',
      () => ELEVATION_TOKENS,
      'FOCUS_TOKENS',
      () => FOCUS_TOKENS,
      'INTERACTIVE_TOKENS',
      () => INTERACTIVE_TOKENS,
      'LAYOUT_TOKENS',
      () => LAYOUT_TOKENS,
      'MOTION_TOKENS',
      () => MOTION_TOKENS,
      'REFETCH_OVERLAY_TOKENS',
      () => REFETCH_OVERLAY_TOKENS,
    ]);
    /**
     * Semantic Design Tokens (Layer 2: Purpose-Based)
     *
     * Primitives를 의미있는 이름으로 매핑합니다.
     * "어떻게 보이는가"보다 "무엇을 위한 것인가"에 집중합니다.
     *
     * SSOT: 용도 기반 토큰 - 컴포넌트는 이 레이어를 참조
     * 변경 시: primitive 참조를 바꾸면 모든 사용처가 자동 업데이트
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/primitives.ts [app-client] (ecmascript)'
      );
    const INTERACTIVE_TOKENS = {
      /** 터치 타겟 크기 */ size: {
        /** 기본 - 대부분의 버튼/아이콘 (WCAG AAA) */ standard:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].touch.minimal,
        /** 컴팩트 - 공간이 제한된 영역 (툴바, 인라인 액션) */ compact:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].touch.minimal,
        /** 편안함 - 주요 액션 버튼 */ comfortable:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].touch.comfortable,
        /** 강조 - Hero CTA, 중요한 액션 */ prominent:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].touch.generous,
      },
      /** 아이콘 크기 */ icon: {
        /** 장식용 작은 아이콘 */ decorative:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].icon.sm,
        /** 기본 interactive 아이콘 */ standard:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].icon.lg,
        /** 강조된 아이콘 */ prominent:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].icon.xl,
      },
      /** 간격 */ spacing: {
        /** 요소 간 간격 */ gap: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SPACING_PRIMITIVES'
        ].gap.comfortable,
        /** 내부 여백 */ padding:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SPACING_PRIMITIVES'
          ].padding.comfortable,
      },
      /** 모서리 */ radius: {
        /** 일반 버튼 */ default:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'RADIUS_PRIMITIVES'
          ].md,
        /** 원형 버튼 (아이콘 전용) */ circular:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'RADIUS_PRIMITIVES'
          ].full,
      },
    };
    const CONTENT_TOKENS = {
      /** 아바타/프로필 */ avatar: {
        small:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].avatar.sm,
        medium:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].avatar.md,
        large:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].avatar.lg,
      },
      /** 배지/카운트 인디케이터 */ badge: {
        small:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].badge.sm,
        medium:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].badge.md,
        large:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SIZE_PRIMITIVES'
          ].badge.lg,
      },
      /** 타이포그래피 */ text: {
        size: {
          caption:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'TYPOGRAPHY_PRIMITIVES'
            ].fontSize.xs,
          body: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'TYPOGRAPHY_PRIMITIVES'
          ].fontSize.base,
          emphasis:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'TYPOGRAPHY_PRIMITIVES'
            ].fontSize.lg,
        },
        weight: {
          regular:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'TYPOGRAPHY_PRIMITIVES'
            ].fontWeight.regular,
          medium:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'TYPOGRAPHY_PRIMITIVES'
            ].fontWeight.medium,
          bold: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'TYPOGRAPHY_PRIMITIVES'
          ].fontWeight.bold,
        },
      },
      /**
       * 숫자 표시 (font-variant-numeric)
       *
       * Web Interface Guidelines: "Apply tabular-nums for number columns"
       * 등폭 숫자로 값 변경 시 레이아웃 시프트 방지
       */ numeric: {
        /** 등폭 숫자 — 통계 카드, 배지 카운트, 테이블 컬럼 */ tabular: 'tabular-nums',
      },
    };
    const MOTION_TOKENS = {
      /** 전환 애니메이션 */ transition: {
        /** 즉각 피드백 (hover, focus) */ instant: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.instant,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.sharp,
        },
        /** 빠른 전환 (드롭다운 열기/닫기) */ fast: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.fast,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.standard,
        },
        /** 표준 전환 (모달, 페이지 전환) */ moderate: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.moderate,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.standard,
        },
        /** 강조 전환 (중요한 상태 변화) */ emphasized: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.slow,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.decelerate,
        },
      },
      /** 등장 애니메이션 */ entrance: {
        /** 페이드 인 */ fade: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.moderate,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.decelerate,
        },
        /** 슬라이드 인 */ slide: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.fast,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.decelerate,
        },
        /** 스프링 (주목) */ spring: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.moderate,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.spring,
        },
      },
      /** 퇴장 애니메이션 */ exit: {
        fade: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.fast,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.accelerate,
        },
        slide: {
          duration:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].duration.fast,
          easing:
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'MOTION_PRIMITIVES'
            ].easing.accelerate,
        },
      },
      /** 연속 애니메이션 */ stagger: {
        /** 리스트 아이템 (알림, 검색 결과) */ list: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'MOTION_PRIMITIVES'
        ].stagger.tight,
        /** 카드 그리드 */ grid: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'MOTION_PRIMITIVES'
        ].stagger.comfortable,
        /** 섹션 */ section:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'MOTION_PRIMITIVES'
          ].stagger.relaxed,
      },
    };
    const ELEVATION_TOKENS = {
      /** Z-index 레이어 */ layer: {
        base: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'ELEVATION_PRIMITIVES'
        ].zIndex.base,
        raised:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].zIndex.raised,
        floating:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].zIndex.dropdown,
        sticky:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].zIndex.sticky,
        overlay:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].zIndex.overlay,
        modal:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].zIndex.modal,
        notification:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].zIndex.toast,
      },
      /** 그림자 */ shadow: {
        none: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'ELEVATION_PRIMITIVES'
        ].shadow.none,
        subtle:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].shadow.sm,
        medium:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].shadow.md,
        prominent:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].shadow.lg,
        dramatic:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ELEVATION_PRIMITIVES'
          ].shadow.xl,
      },
    };
    const LAYOUT_TOKENS = {
      /** 섹션 간 간격 */ section: {
        gap: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SPACING_PRIMITIVES'
        ].gap.spacious,
      },
      /** 컨테이너 패딩 */ container: {
        padding:
          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$primitives$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'SPACING_PRIMITIVES'
          ].padding.relaxed,
      },
    };
    const FOCUS_TOKENS = {
      /** 포커스 링 수치 */ ring: {
        width: 2,
        offset: 2,
      },
      /**
       * Ready-to-use Tailwind 포커스 클래스
       *
       * Web Interface Guidelines: "Use :focus-visible over :focus"
       * focus-visible: 키보드 네비게이션에서만 포커스 링 표시
       */ classes: {
        /** 기본: 밝은 배경 (primary 색상) */ default:
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        /** 브랜드: UL 색상 (헤더 영역) */ brand:
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ul-info focus-visible:ring-offset-2',
        /** 어두운 배경 (사이드바, 모바일 네비) */ onDark:
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ul-info focus-visible:ring-offset-2 focus-visible:ring-offset-ul-midnight',
      },
    };
    const REFETCH_OVERLAY_TOKENS = {
      /** 상대 위치 래퍼 (스피너 절대 위치의 기준점) */ wrapper: 'relative',
      /** 콘텐츠 영역 — refetch 시 반투명 + 포인터 차단 */ contentRefetching:
        'opacity-40 pointer-events-none',
      /** 스피너 오버레이 (absolute center) */ spinnerOverlay:
        'absolute inset-0 flex items-center justify-center z-10',
      /** 스피너 아이콘 */ spinner: 'h-5 w-5 text-brand-text-muted motion-safe:animate-spin',
    };
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'ANIMATION_PRESETS',
      () => ANIMATION_PRESETS,
      'TRANSITION_PRESETS',
      () => TRANSITION_PRESETS,
      'getAnimationDuration',
      () => getAnimationDuration,
      'getAnimationEasing',
      () => getAnimationEasing,
      'getStaggerDelay',
      () => getStaggerDelay,
      'getTransitionClasses',
      () => getTransitionClasses,
    ]);
    /**
     * Motion System (애니메이션 유틸리티)
     *
     * Semantic tokens를 Tailwind/CSS로 변환하는 헬퍼 함수들
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    function getTransitionClasses(
      speed = 'fast',
      properties = ['background-color', 'transform', 'opacity', 'box-shadow']
    ) {
      const motion =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'MOTION_TOKENS'
        ].transition[speed];
      // prefers-reduced-motion 지원
      return [
        `motion-safe:transition-[${properties.join(',')}]`,
        `motion-safe:duration-${motion.duration}`,
        `motion-safe:ease-[${motion.easing}]`,
        'motion-reduce:transition-none',
      ].join(' ');
    }
    function getStaggerDelay(index, type = 'list') {
      const delay =
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'MOTION_TOKENS'
        ].stagger[type];
      return `${index * delay}ms`;
    }
    const TRANSITION_PRESETS = {
      // ── Fast (200ms) ──────────────────────────────
      /** background-color */ fastBg: getTransitionClasses('fast', ['background-color']),
      /** color */ fastColor: getTransitionClasses('fast', ['color']),
      /** opacity */ fastOpacity: getTransitionClasses('fast', ['opacity']),
      /** transform */ fastTransform: getTransitionClasses('fast', ['transform']),
      /** background-color, color */ fastBgColor: getTransitionClasses('fast', [
        'background-color',
        'color',
      ]),
      /** background-color, transform */ fastBgTransform: getTransitionClasses('fast', [
        'background-color',
        'transform',
      ]),
      /** background-color, border-color */ fastBgBorder: getTransitionClasses('fast', [
        'background-color',
        'border-color',
      ]),
      /** background-color, box-shadow */ fastBgShadow: getTransitionClasses('fast', [
        'background-color',
        'box-shadow',
      ]),
      /** background-color, color, border-color */ fastBgColorBorder: getTransitionClasses('fast', [
        'background-color',
        'color',
        'border-color',
      ]),
      /** background-color, color, transform */ fastBgColorTransform: getTransitionClasses('fast', [
        'background-color',
        'color',
        'transform',
      ]),
      /** background-color, transform, box-shadow */ fastBgTransformShadow: getTransitionClasses(
        'fast',
        ['background-color', 'transform', 'box-shadow']
      ),
      /** background-color, opacity, border-color */ fastBgOpacityBorder: getTransitionClasses(
        'fast',
        ['background-color', 'opacity', 'border-color']
      ),
      /** box-shadow */ fastShadow: getTransitionClasses('fast', ['box-shadow']),
      /** box-shadow, transform */ fastShadowTransform: getTransitionClasses('fast', [
        'box-shadow',
        'transform',
      ]),
      /** box-shadow, border-color */ fastShadowBorder: getTransitionClasses('fast', [
        'box-shadow',
        'border-color',
      ]),
      /** box-shadow, transform, border-color */ fastShadowTransformBorder: getTransitionClasses(
        'fast',
        ['box-shadow', 'transform', 'border-color']
      ),
      /** border-color, background-color (= fastBgBorder, alias for readability) */ fastBorderBg:
        getTransitionClasses('fast', ['border-color', 'background-color']),
      /** border-color, box-shadow */ fastBorderShadow: getTransitionClasses('fast', [
        'border-color',
        'box-shadow',
      ]),
      /** color, border-color */ fastColorBorder: getTransitionClasses('fast', [
        'color',
        'border-color',
      ]),
      /** transform, opacity */ fastTransformOpacity: getTransitionClasses('fast', [
        'transform',
        'opacity',
      ]),
      /** transform, background-color, opacity */ fastTransformBgOpacity: getTransitionClasses(
        'fast',
        ['transform', 'background-color', 'opacity']
      ),
      /** background-color, transform, opacity, box-shadow (기본 4속성) */ fastAll:
        getTransitionClasses('fast', ['background-color', 'transform', 'opacity', 'box-shadow']),
      // ── Fast (200ms) — 추가 조합 ─────────────────
      /** background-color, color, box-shadow */ fastBgColorShadow: getTransitionClasses('fast', [
        'background-color',
        'color',
        'box-shadow',
      ]),
      /** background-color, color, box-shadow, transform */ fastBgColorShadowTransform:
        getTransitionClasses('fast', ['background-color', 'color', 'box-shadow', 'transform']),
      /** border-color, background-color, transform */ fastBorderBgTransform: getTransitionClasses(
        'fast',
        ['border-color', 'background-color', 'transform']
      ),
      // ── Instant (100ms) ───────────────────────────
      /** background-color */ instantBg: getTransitionClasses('instant', ['background-color']),
      /** color */ instantColor: getTransitionClasses('instant', ['color']),
      /** opacity */ instantOpacity: getTransitionClasses('instant', ['opacity']),
      /** transform */ instantTransform: getTransitionClasses('instant', ['transform']),
      /** background-color, border-color */ instantBgBorder: getTransitionClasses('instant', [
        'background-color',
        'border-color',
      ]),
      /** background-color, color */ instantBgColor: getTransitionClasses('instant', [
        'background-color',
        'color',
      ]),
      /** background-color, border-color, color */ instantBgBorderColor: getTransitionClasses(
        'instant',
        ['background-color', 'border-color', 'color']
      ),
      /** border-color, box-shadow */ instantBorderShadow: getTransitionClasses('instant', [
        'border-color',
        'box-shadow',
      ]),
      /** background-color, box-shadow, transform */ instantBgShadowTransform: getTransitionClasses(
        'instant',
        ['background-color', 'box-shadow', 'transform']
      ),
      // ── Moderate (300ms) ──────────────────────────
      /** opacity */ moderateOpacity: getTransitionClasses('moderate', ['opacity']),
      /** transform */ moderateTransform: getTransitionClasses('moderate', ['transform']),
      /** box-shadow */ moderateShadow: getTransitionClasses('moderate', ['box-shadow']),
      /** box-shadow, transform */ moderateShadowTransform: getTransitionClasses('moderate', [
        'box-shadow',
        'transform',
      ]),
    };
    const ANIMATION_PRESETS = {
      /** 페이드 인 */ fadeIn: 'motion-safe:animate-in motion-safe:fade-in',
      /** 페이드 아웃 */ fadeOut: 'motion-safe:animate-out motion-safe:fade-out',
      /** 슬라이드 업 */ slideUp: 'motion-safe:animate-in motion-safe:slide-in-from-bottom-4',
      /** 슬라이드 다운 */ slideDown: 'motion-safe:animate-in motion-safe:slide-in-from-top-4',
      /**
       * 슬라이드 업 + 페이드 인 복합 (SSOT)
       *
       * 탭 콘텐츠 전환, 타임라인 아이템 입장 등 방향성 있는 등장에 사용.
       * 단일 animate-in 선언으로 fade + slide를 동시 적용.
       * duration은 사용처에서 `motion-safe:duration-*`으로 별도 지정.
       *
       * @example
       * className={cn(ANIMATION_PRESETS.slideUpFade, 'motion-safe:duration-200')}
       */ slideUpFade:
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3',
      /** 스케일 업 (팝) */ scaleUp: 'motion-safe:animate-in motion-safe:zoom-in-95',
      /** 펄스 (주목) */ pulse: 'motion-safe:animate-pulse',
      /** 스핀 (로딩) */ spin: 'motion-safe:animate-spin',
    };
    function getAnimationDuration(speed = 'fast') {
      return `${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['MOTION_TOKENS'].transition[speed].duration}ms`;
    }
    function getAnimationEasing(speed = 'fast') {
      return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'MOTION_TOKENS'
      ].transition[speed].easing;
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/design-tokens/components/auth.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'AUTH_BACKGROUND_TOKENS',
      () => AUTH_BACKGROUND_TOKENS,
      'AUTH_CONTENT',
      () => AUTH_CONTENT,
      'AUTH_INPUT_TOKENS',
      () => AUTH_INPUT_TOKENS,
      'AUTH_LAYOUT_TOKENS',
      () => AUTH_LAYOUT_TOKENS,
      'AUTH_MOTION_TOKENS',
      () => AUTH_MOTION_TOKENS,
      'AUTH_SPLIT_TOKENS',
      () => AUTH_SPLIT_TOKENS,
      'IDLE_TIMEOUT_DIALOG_TOKENS',
      () => IDLE_TIMEOUT_DIALOG_TOKENS,
      'getAuthButtonClasses',
      () => getAuthButtonClasses,
      'getAuthErrorClasses',
      () => getAuthErrorClasses,
      'getAuthInputClasses',
      () => getAuthInputClasses,
      'getAuthInteractiveScaleClasses',
      () => getAuthInteractiveScaleClasses,
      'getAuthStaggerDelay',
      () => getAuthStaggerDelay,
      'getIdleTimeoutUrgencyClasses',
      () => getIdleTimeoutUrgencyClasses,
    ]);
    /**
     * Auth Component Tokens
     *
     * 인증 관련 컴포넌트의 디자인 토큰
     * SSOT: 로그인/회원가입 UI의 모든 디자인 값은 여기서 정의
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/semantic.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/motion.ts [app-client] (ecmascript)'
      );
    const AUTH_INPUT_TOKENS = {
      /** 인풋 필드 높이 */ height:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'INTERACTIVE_TOKENS'
        ].size.comfortable,
      /** 아이콘 영역 여백 */ iconPadding: {
        mobile: 40,
        desktop: 40,
      },
      /** 아이콘 크기 */ iconSize:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'INTERACTIVE_TOKENS'
        ].icon.standard,
      /** Border radius */ borderRadius:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'INTERACTIVE_TOKENS'
        ].radius.default,
      /** Focus ring */ focusRing: {
        width: 2,
        opacity: 0.2,
      },
    };
    const AUTH_MOTION_TOKENS = {
      /** Form transition */ formTransition:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'MOTION_TOKENS'
        ].transition.fast,
      /** Success state transition */ successTransition:
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'MOTION_TOKENS'
        ].transition.moderate,
      /** Error shake animation */ errorShake: {
        duration: 500,
        keyframes:
          '@keyframes auth-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }',
      },
      /** Input focus scale */ inputFocusScale: 1.01,
      /** Button hover scale */ buttonHoverScale: 1.01,
      /** Button active scale */ buttonActiveScale: 0.99,
    };
    function getAuthInputClasses(hasError = false) {
      return [
        // Size
        'h-12',
        'pl-10',
        // Background
        'bg-white dark:bg-card',
        // Border
        'border-border',
        hasError
          ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
          : 'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
        // Transition (TRANSITION_PRESETS.fastBorderShadow)
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastBorderShadow,
      ].join(' ');
    }
    function getAuthButtonClasses(variant = 'primary') {
      const baseClasses = [
        // Size
        'w-full h-12 text-base font-medium',
        // Focus
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        // Transition (TRANSITION_PRESETS.fastBgColorShadowTransform)
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$motion$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'TRANSITION_PRESETS'
        ].fastBgColorShadowTransform,
        // Hover effects
        'hover:scale-[1.01] active:scale-[0.99]',
      ];
      const variantClasses = {
        primary: [
          'bg-ul-midnight hover:bg-ul-midnight-dark text-white',
          'focus-visible:ring-ul-midnight/50',
        ],
        success: ['bg-ul-green hover:bg-ul-green text-white', 'focus-visible:ring-ul-green/50'],
      };
      return [...baseClasses, ...variantClasses[variant]].join(' ');
    }
    function getAuthErrorClasses() {
      return [
        'flex items-center gap-2 p-3',
        'text-sm text-destructive',
        'bg-destructive/10 border border-destructive/20',
        'rounded-lg',
      ].join(' ');
    }
    const AUTH_CONTENT = {
      brand: {
        systemName: '장비 관리 시스템',
        systemNameKey: 'auth.errorPage.systemName',
        systemNameEn: 'Equipment Management System',
        companyName: 'UL Solutions',
        tagline: 'Working for a safer world.',
      },
      login: {
        heading: '시스템 로그인',
        headingKey: 'auth.login.heading',
        description: '장비 관리 시스템에 접근하려면 인증이 필요합니다',
        descriptionKey: 'auth.login.description',
        formHeading: '계정 로그인',
        formHeadingKey: 'auth.login.formHeading',
      },
      branding: {
        headline: '효율적인 장비 관리를',
        headlineKey: 'auth.branding.headline',
        headlineAccent: '통합 솔루션',
        headlineAccentKey: 'auth.branding.headlineAccent',
        headlineSuffix: '으로',
        headlineSuffixKey: 'auth.branding.headlineSuffix',
        subtitle: '시험소 장비의 등록, 교정, 대여, 반출을 한 곳에서 관리하세요.',
        subtitleKey: 'auth.branding.subtitle',
      },
      button: {
        login: '로그인',
        loginKey: 'auth.login.submitButton',
        loginLoading: '인증 진행 중\u2026',
        loginLoadingKey: 'auth.login.submitting',
        loginSuccess: '인증 완료',
        loginSuccessKey: 'auth.login.submitSuccess',
        azureAd: 'Microsoft 계정으로 로그인',
        azureAdKey: 'auth.login.ssoButton',
        azureAdLoading: '연결 중\u2026',
        azureAdLoadingKey: 'auth.login.ssoLoading',
        skipToForm: '로그인 폼으로 이동',
        skipToFormKey: 'auth.login.skipToForm',
      },
      error: {
        authFailed: '이메일 또는 비밀번호가 일치하지 않습니다. 입력 내용을 확인해 주세요.',
        authFailedKey: 'auth.login.authFailed',
        systemError: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        systemErrorKey: 'auth.login.systemError',
        configRequired: '인증 설정이 필요합니다.',
        configRequiredKey: 'auth.login.configRequired',
      },
      separator: '또는',
      separatorKey: 'auth.login.separator',
      copyright: (year) =>
        `\u00A9 ${year} ${AUTH_CONTENT.brand.systemNameEn}. All rights reserved.`,
      features: [
        {
          icon: 'Settings',
          title: '체계적인 장비 관리',
          titleKey: 'auth.branding.features.management',
        },
        {
          icon: 'Calendar',
          title: '실시간 교정 추적',
          titleKey: 'auth.branding.features.tracking',
        },
        {
          icon: 'Shield',
          title: '역할 기반 승인',
          titleKey: 'auth.branding.features.approval',
        },
      ],
    };
    const AUTH_BACKGROUND_TOKENS = {
      /** 전체 페이지 배경 (dark 강제) */ page: 'bg-brand-bg-base min-h-screen',
      /** CSS-only 그리드 패턴 */ grid: {
        opacity: 0.04,
        size: 48,
        lineColor: 'rgba(255,255,255,0.08)',
      },
    };
    const AUTH_SPLIT_TOKENS = {
      left: {
        bg: '#122C49',
        gradient: 'radial-gradient(circle at 30% 70%, #1e3a5f 0%, #122C49 60%, #0a1c30 100%)',
        grid: {
          opacity: 0.04,
          size: 48,
          lineColor: 'rgba(255,255,255,0.08)',
        },
      },
      right: {
        grid: {
          opacity: 0.05,
          size: 48,
          lineColor: 'hsl(220 15% 60%)',
        },
      },
    };
    const AUTH_LAYOUT_TOKENS = {
      /** 로고 컨테이너 */ logo: {
        container: 'w-10 h-10',
        iconSize: 'w-5 h-5',
        borderRadius: 'rounded-lg',
      },
      /** 중앙 카드 */ card: 'bg-brand-bg-surface border border-brand-border-subtle rounded-2xl p-8',
      /** 분리선 */ separator: {
        container: 'relative flex items-center gap-4',
      },
      /** Microsoft 버튼 */ microsoft: {
        bg: '#0078D4',
        bgHover: '#106EBE',
      },
    };
    function getAuthInteractiveScaleClasses() {
      return 'hover:scale-[1.01] active:scale-[0.99]';
    }
    function getAuthStaggerDelay(index, baseDelay = 200, increment = 100) {
      return `${baseDelay + index * increment}ms`;
    }
    const IDLE_TIMEOUT_DIALOG_TOKENS = {
      /** 아이콘 컨테이너 (DeleteTeamModal 원형 배경 패턴) */ iconContainer:
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10',
      /** 아이콘 크기 + 색상 */ iconSize: 'h-5 w-5 text-destructive',
      /** 카운트다운 링 SVG 수치 */ ring: {
        size: 80,
        strokeWidth: 3,
      },
      /** 카운트다운 숫자 (Layer 2 CONTENT_TOKENS 참조 — 레이아웃 시프트 방지) */ countdownText: `${__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$semantic$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__['CONTENT_TOKENS'].numeric.tabular} text-2xl font-semibold leading-none`,
      /** 카운트다운 하위 라벨 */ countdownLabel: 'text-xs text-muted-foreground mt-0.5',
      /** 링 트랙 (배경 원) 색상 */ ringTrack: 'text-muted-foreground/20',
      /** 링 진행률 transition (motion-safe, specific property — transition-all 금지) */ ringTransition:
        'motion-safe:transition-[stroke-dashoffset,color] motion-safe:duration-1000 motion-safe:ease-linear',
      /** 긴급 시각 전환 임계값 (초) — 이 시간 이하에서 amber → destructive */ urgentThresholdSeconds: 60,
    };
    function getIdleTimeoutUrgencyClasses(secondsRemaining) {
      const isUrgent = secondsRemaining <= IDLE_TIMEOUT_DIALOG_TOKENS.urgentThresholdSeconds;
      return {
        text: isUrgent ? 'text-destructive' : 'text-brand-warning',
        ring: isUrgent ? 'text-destructive' : 'text-brand-warning',
      };
    }
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['IdleTimeoutDialog', () => IdleTimeoutDialog]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/alert-dialog.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/auth-token.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/design-tokens/components/auth.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    // SVG ring 상수 (design token에서 파생)
    const RING =
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'IDLE_TIMEOUT_DIALOG_TOKENS'
      ].ring;
    const RADIUS = (RING.size - RING.strokeWidth) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    function formatCountdown(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    function IdleTimeoutDialog({ open, secondsRemaining, onContinue, onLogout }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('auth.idleTimeout');
      const urgency = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getIdleTimeoutUrgencyClasses'
      ])(secondsRemaining);
      const progress =
        secondsRemaining /
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'IDLE_WARNING_BEFORE_SECONDS'
        ];
      const dashoffset = CIRCUMFERENCE * (1 - progress);
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'AlertDialog'
        ],
        {
          open: open,
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'AlertDialogContent'
            ],
            {
              onEscapeKeyDown: (e) => {
                e.preventDefault();
                onContinue();
              },
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'AlertDialogHeader'
                  ],
                  {
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: 'flex items-center gap-3',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              'div',
                              {
                                className:
                                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'IDLE_TIMEOUT_DIALOG_TOKENS'
                                  ].iconContainer,
                                children: /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__[
                                    'Clock'
                                  ],
                                  {
                                    className:
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'IDLE_TIMEOUT_DIALOG_TOKENS'
                                      ].iconSize,
                                    'aria-hidden': 'true',
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                                    lineNumber: 60,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                                lineNumber: 59,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'AlertDialogTitle'
                              ],
                              {
                                children: t('title'),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                                lineNumber: 62,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                          lineNumber: 58,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'AlertDialogDescription'
                        ],
                        {
                          children: t('description'),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                          lineNumber: 64,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                    lineNumber: 57,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  'div',
                  {
                    className: 'flex flex-col items-center py-4',
                    role: 'timer',
                    'aria-label': `${formatCountdown(secondsRemaining)} ${t('remaining')}`,
                    children: /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'div',
                      {
                        className: 'relative',
                        style: {
                          width: RING.size,
                          height: RING.size,
                        },
                        children: [
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'svg',
                            {
                              className: '-rotate-90',
                              width: RING.size,
                              height: RING.size,
                              viewBox: `0 0 ${RING.size} ${RING.size}`,
                              'aria-hidden': 'true',
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'circle',
                                  {
                                    cx: RING.size / 2,
                                    cy: RING.size / 2,
                                    r: RADIUS,
                                    fill: 'none',
                                    strokeWidth: RING.strokeWidth,
                                    className:
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'IDLE_TIMEOUT_DIALOG_TOKENS'
                                      ].ringTrack,
                                    stroke: 'currentColor',
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                                    lineNumber: 82,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'circle',
                                  {
                                    cx: RING.size / 2,
                                    cy: RING.size / 2,
                                    r: RADIUS,
                                    fill: 'none',
                                    strokeWidth: RING.strokeWidth,
                                    strokeLinecap: 'round',
                                    stroke: 'currentColor',
                                    strokeDasharray: CIRCUMFERENCE,
                                    className: (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                      'cn'
                                    ])(
                                      urgency.ring,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'IDLE_TIMEOUT_DIALOG_TOKENS'
                                      ].ringTransition
                                    ),
                                    style: {
                                      strokeDashoffset: dashoffset,
                                    },
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                                    lineNumber: 92,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName:
                                '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                              lineNumber: 74,
                              columnNumber: 13,
                            },
                            this
                          ),
                          /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            'div',
                            {
                              className:
                                'absolute inset-0 flex flex-col items-center justify-center',
                              children: [
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'span',
                                  {
                                    className: (0,
                                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                                      'cn'
                                    ])(
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'IDLE_TIMEOUT_DIALOG_TOKENS'
                                      ].countdownText,
                                      urgency.text
                                    ),
                                    children: formatCountdown(secondsRemaining),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                                    lineNumber: 107,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'span',
                                  {
                                    className:
                                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$design$2d$tokens$2f$components$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'IDLE_TIMEOUT_DIALOG_TOKENS'
                                      ].countdownLabel,
                                    children: t('remaining'),
                                  },
                                  void 0,
                                  false,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                                    lineNumber: 110,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                              ],
                            },
                            void 0,
                            true,
                            {
                              fileName:
                                '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                              lineNumber: 106,
                              columnNumber: 13,
                            },
                            this
                          ),
                        ],
                      },
                      void 0,
                      true,
                      {
                        fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                        lineNumber: 73,
                        columnNumber: 11,
                      },
                      this
                    ),
                  },
                  void 0,
                  false,
                  {
                    fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                    lineNumber: 68,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'AlertDialogFooter'
                  ],
                  {
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'AlertDialogCancel'
                        ],
                        {
                          onClick: onContinue,
                          autoFocus: true,
                          children: t('continueButton'),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                          lineNumber: 116,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$alert$2d$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'AlertDialogAction'
                        ],
                        {
                          onClick: onLogout,
                          className: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'buttonVariants'
                          ])({
                            variant: 'destructive',
                          }),
                          children: t('logoutButton'),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                          lineNumber: 119,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
                    lineNumber: 115,
                    columnNumber: 9,
                  },
                  this
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
              lineNumber: 51,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx',
          lineNumber: 50,
          columnNumber: 5,
        },
        this
      );
    }
    _s(IdleTimeoutDialog, 'h6+q2O3NJKPY5uL0BIJGLIanww8=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = IdleTimeoutDialog;
    var _c;
    __turbopack_context__.k.register(_c, 'IdleTimeoutDialog');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/lib/providers.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Providers', () => Providers]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/api-client.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$authenticated$2d$client$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/authenticated-client-provider.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/api/query-config.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$patch$2d$performance$2d$measure$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils/patch-performance-measure.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/index.ts [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/packages/shared-constants/src/auth-token.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$idle$2d$timeout$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/hooks/use-idle-timeout.ts [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$auth$2f$IdleTimeoutDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/auth/IdleTimeoutDialog.tsx [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    // 탭 복귀 후 쿼리 갱신 임계값: 5분 이상 자리를 비웠으면 세션+쿼리 함께 갱신
    const TAB_AWAY_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
    // Turbopack 개발 모드 Performance.measure 음수 타임스탬프 버그 패치
    // https://github.com/vercel/next.js/issues/86060
    (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2f$patch$2d$performance$2d$measure$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'patchPerformanceMeasure'
    ])();
    // React Query 클라이언트 인스턴스 생성
    const queryClient =
      new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'QueryClient'
      ]({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime:
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$query$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'CACHE_TIMES'
              ].LONG,
          },
        },
      });
    /**
     * 인증 상태 동기화 컴포넌트
     *
     * ⚠️ 중요: localStorage 토큰 사용 금지
     * - 모든 인증 토큰은 NextAuth 세션(httpOnly 쿠키)에서 관리
     * - API 클라이언트는 getSession()을 통해 토큰 접근
     * - 참고: docs/development/AUTH_ARCHITECTURE.md
     *
     * Token Refresh 아키텍처:
     * - SessionProvider refetchInterval(5분)로 주기적 JWT 콜백 트리거
     * - session.error === 'RefreshAccessTokenError' 감지 시 자동 로그아웃
     */ function AuthSync({ children }) {
      _s();
      const { data: session, status } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useSession'
      ])();
      const statusRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useRef'
      ])(status);
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'AuthSync.useEffect': () => {
            statusRef.current = status;
          },
        }['AuthSync.useEffect'],
        [status]
      );
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'AuthSync.useEffect': () => {
            // 로그아웃 시 API 클라이언트 토큰 캐시 초기화
            if (status === 'unauthenticated') {
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'clearTokenCache'
              ])();
            }
          },
        }['AuthSync.useEffect'],
        [status]
      );
      // Refresh Token 만료 감지 → 자동 로그아웃
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'AuthSync.useEffect': () => {
            if (session?.error === 'RefreshAccessTokenError') {
              console.error('[AuthSync] Refresh token expired, signing out...');
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'signOut'
              ])({
                callbackUrl: '/login',
              });
            }
          },
        }['AuthSync.useEffect'],
        [session?.error]
      );
      // 세션 만료 이벤트 SSOT 핸들러 (api-client, authenticated-client-provider에서 발생)
      // loading 중 401은 세션 복원 과정이므로 무시
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'AuthSync.useEffect': () => {
            const handleSessionExpired = {
              'AuthSync.useEffect.handleSessionExpired': () => {
                if (statusRef.current === 'authenticated') {
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'clearTokenCache'
                  ])();
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'signOut'
                  ])({
                    callbackUrl: '/login',
                  });
                }
              },
            }['AuthSync.useEffect.handleSessionExpired'];
            window.addEventListener('auth:session-expired', handleSessionExpired);
            return {
              'AuthSync.useEffect': () => {
                window.removeEventListener('auth:session-expired', handleSessionExpired);
              },
            }['AuthSync.useEffect'];
          },
        }['AuthSync.useEffect'],
        []
      );
      // 탭 복귀 핸들러: 오래 자리를 비운 뒤 돌아오면 세션 갱신 + 스테일 쿼리 무효화
      // 브라우저 타이머 스로틀링으로 refetchInterval이 제대로 안 돌았을 수 있으므로
      // visibilitychange 이벤트를 직접 처리해 토큰과 캐시를 함께 복구
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'AuthSync.useEffect': () => {
            let hiddenAt = null;
            const handleVisibilityChange = {
              'AuthSync.useEffect.handleVisibilityChange': async () => {
                if (document.visibilityState === 'hidden') {
                  hiddenAt = Date.now();
                  return;
                }
                // 탭이 다시 보임 — 충분히 오래 자리를 비웠을 때만 갱신
                if (hiddenAt === null || Date.now() - hiddenAt < TAB_AWAY_REFRESH_THRESHOLD_MS) {
                  hiddenAt = null;
                  return;
                }
                hiddenAt = null;
                if (statusRef.current !== 'authenticated') return;
                // 1단계: 세션(토큰) 갱신 — JWT 콜백이 서버에서 Access Token을 재발급
                const refreshed = await (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'getSession'
                ])();
                if (refreshed?.error === 'RefreshAccessTokenError') {
                  // Refresh Token도 만료 → AuthSync의 session.error 감지 로직이 처리
                  return;
                }
                // 2단계: 갱신된 토큰으로 스테일 쿼리 재조회 (현재 마운트된 것만)
                queryClient.invalidateQueries({
                  refetchType: 'active',
                });
              },
            }['AuthSync.useEffect.handleVisibilityChange'];
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return {
              'AuthSync.useEffect': () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
              },
            }['AuthSync.useEffect'];
          },
        }['AuthSync.useEffect'],
        []
      );
      // 레거시 localStorage 토큰 정리 (마이그레이션)
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'AuthSync.useEffect': () => {
            if (('TURBOPACK compile-time truthy', 1)) {
              const legacyToken = localStorage.getItem('token');
              if (legacyToken) {
                console.warn('[Auth] 레거시 localStorage 토큰 발견. 삭제합니다.');
                localStorage.removeItem('token');
                localStorage.removeItem('accessToken');
              }
            }
          },
        }['AuthSync.useEffect'],
        []
      );
      // ─── Idle Timeout ────────────────────────────────────────────────────────────
      const { isWarningVisible, secondsRemaining, handleContinue, handleLogout } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$idle$2d$timeout$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useIdleTimeout'
      ])();
      // ─── Multi-tab BroadcastChannel 수신 ─────────────────────────────────────────
      // logout / idle-logout 메시지를 수신해 다른 탭에서 발생한 로그아웃을 동기화
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'AuthSync.useEffect': () => {
            if (
              ('TURBOPACK compile-time value', 'object') === 'undefined' ||
              !('BroadcastChannel' in window)
            )
              return;
            const ch = new BroadcastChannel(
              __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'SESSION_SYNC_CHANNEL'
              ]
            );
            ch.onmessage = {
              'AuthSync.useEffect': (event) => {
                const { type } = event.data;
                if (
                  (type ===
                    __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'SESSION_SYNC_MESSAGE'
                    ].LOGOUT ||
                    type ===
                      __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$constants$2f$src$2f$auth$2d$token$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'SESSION_SYNC_MESSAGE'
                      ].IDLE_LOGOUT) &&
                  statusRef.current === 'authenticated'
                ) {
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'clearTokenCache'
                  ])();
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'signOut'
                  ])({
                    callbackUrl: '/login',
                  });
                }
              },
            }['AuthSync.useEffect'];
            return {
              'AuthSync.useEffect': () => ch.close(),
            }['AuthSync.useEffect'];
          },
        }['AuthSync.useEffect'],
        []
      ); // statusRef로 최신 status 참조 — 의존성 불필요
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children: [
            children,
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$auth$2f$IdleTimeoutDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'IdleTimeoutDialog'
              ],
              {
                open: isWarningVisible,
                secondsRemaining: secondsRemaining,
                onContinue: handleContinue,
                onLogout: handleLogout,
              },
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/lib/providers.tsx',
                lineNumber: 167,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true
      );
    }
    _s(AuthSync, 'aQyWrvDy78bE7QQQ4NVsF+PZwXY=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useSession'
        ],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$hooks$2f$use$2d$idle$2d$timeout$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useIdleTimeout'
        ],
      ];
    });
    _c = AuthSync;
    function Providers({ children }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SessionProvider'
        ],
        {
          refetchInterval: 5 * 60,
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ThemeProvider'
            ],
            {
              attribute: 'class',
              defaultTheme: 'light',
              disableTransitionOnChange: true,
              children: /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'QueryClientProvider'
                ],
                {
                  client: queryClient,
                  children: /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsxDEV'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$api$2f$authenticated$2d$client$2d$provider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'AuthenticatedClientProvider'
                    ],
                    {
                      children: /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        AuthSync,
                        {
                          children: children,
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/lib/providers.tsx',
                          lineNumber: 184,
                          columnNumber: 13,
                        },
                        this
                      ),
                    },
                    void 0,
                    false,
                    {
                      fileName: '[project]/apps/frontend/lib/providers.tsx',
                      lineNumber: 183,
                      columnNumber: 11,
                    },
                    this
                  ),
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/lib/providers.tsx',
                  lineNumber: 181,
                  columnNumber: 9,
                },
                this
              ),
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/lib/providers.tsx',
              lineNumber: 180,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/lib/providers.tsx',
          lineNumber: 179,
          columnNumber: 5,
        },
        this
      );
    }
    _c1 = Providers;
    var _c, _c1;
    __turbopack_context__.k.register(_c, 'AuthSync');
    __turbopack_context__.k.register(_c1, 'Providers');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/toast.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Toast',
      () => Toast,
      'ToastAction',
      () => ToastAction,
      'ToastClose',
      () => ToastClose,
      'ToastDescription',
      () => ToastDescription,
      'ToastProvider',
      () => ToastProvider,
      'ToastTitle',
      () => ToastTitle,
      'ToastViewport',
      () => ToastViewport,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    ('use client');
    const ToastProvider =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Provider'
      ];
    const ToastViewport =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Viewport'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/toast.tsx',
              lineNumber: 16,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = ToastViewport;
    ToastViewport.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Viewport'
      ].displayName;
    const toastVariants = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'cva'
    ])(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg motion-safe:transition-[transform,opacity] motion-reduce:transition-none data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
      {
        variants: {
          variant: {
            default: 'border bg-background',
            destructive:
              'destructive group border-destructive bg-destructive text-destructive-foreground',
          },
        },
        defaultVariants: {
          variant: 'default',
        },
      }
    );
    const Toast =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c2 = ({ className, variant, ...props }, ref) => {
          return /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Root'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                toastVariants({
                  variant,
                }),
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/toast.tsx',
              lineNumber: 48,
              columnNumber: 5,
            },
            ('TURBOPACK compile-time value', void 0)
          );
        })
      );
    _c3 = Toast;
    Toast.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Root'
      ].displayName;
    const ToastAction =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c4 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Action'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background motion-safe:transition-colors motion-reduce:transition-none hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/toast.tsx',
              lineNumber: 61,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c5 = ToastAction;
    ToastAction.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Action'
      ].displayName;
    const ToastClose =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c6 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Close'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 motion-safe:transition-opacity motion-reduce:transition-none hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-destructive-foreground/70 group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive group-[.destructive]:focus:ring-offset-destructive',
                className
              ),
              'toast-close': '',
              ...props,
              children: /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__[
                  'X'
                ],
                {
                  className: 'h-4 w-4',
                },
                void 0,
                false,
                {
                  fileName: '[project]/apps/frontend/components/ui/toast.tsx',
                  lineNumber: 85,
                  columnNumber: 5,
                },
                ('TURBOPACK compile-time value', void 0)
              ),
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/toast.tsx',
              lineNumber: 76,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c7 = ToastClose;
    ToastClose.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Close'
      ].displayName;
    const ToastTitle =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c8 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Title'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-sm font-semibold', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/toast.tsx',
              lineNumber: 94,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c9 = ToastTitle;
    ToastTitle.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Title'
      ].displayName;
    const ToastDescription =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c10 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Description'
            ],
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-sm opacity-90', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/toast.tsx',
              lineNumber: 102,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c11 = ToastDescription;
    ToastDescription.displayName =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Description'
      ].displayName;
    var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
    __turbopack_context__.k.register(_c, 'ToastViewport$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'ToastViewport');
    __turbopack_context__.k.register(_c2, 'Toast$React.forwardRef');
    __turbopack_context__.k.register(_c3, 'Toast');
    __turbopack_context__.k.register(_c4, 'ToastAction$React.forwardRef');
    __turbopack_context__.k.register(_c5, 'ToastAction');
    __turbopack_context__.k.register(_c6, 'ToastClose$React.forwardRef');
    __turbopack_context__.k.register(_c7, 'ToastClose');
    __turbopack_context__.k.register(_c8, 'ToastTitle$React.forwardRef');
    __turbopack_context__.k.register(_c9, 'ToastTitle');
    __turbopack_context__.k.register(_c10, 'ToastDescription$React.forwardRef');
    __turbopack_context__.k.register(_c11, 'ToastDescription');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/use-toast.ts [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'reducer',
      () => reducer,
      'toast',
      () => toast,
      'useToast',
      () => useToast,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    const TOAST_LIMIT = 1;
    const TOAST_REMOVE_DELAY = 1000;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used for ActionType type inference
    const actionTypes = {
      ADD_TOAST: 'ADD_TOAST',
      UPDATE_TOAST: 'UPDATE_TOAST',
      DISMISS_TOAST: 'DISMISS_TOAST',
      REMOVE_TOAST: 'REMOVE_TOAST',
    };
    let count = 0;
    function genId() {
      count = (count + 1) % Number.MAX_VALUE;
      return count.toString();
    }
    const toastTimeouts = new Map();
    const addToRemoveQueue = (toastId) => {
      if (toastTimeouts.has(toastId)) {
        return;
      }
      const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({
          type: 'REMOVE_TOAST',
          toastId: toastId,
        });
      }, TOAST_REMOVE_DELAY);
      toastTimeouts.set(toastId, timeout);
    };
    const reducer = (state, action) => {
      switch (action.type) {
        case 'ADD_TOAST':
          return {
            ...state,
            toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
          };
        case 'UPDATE_TOAST':
          return {
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === action.toast.id
                ? {
                    ...t,
                    ...action.toast,
                  }
                : t
            ),
          };
        case 'DISMISS_TOAST': {
          const { toastId } = action;
          if (toastId) {
            addToRemoveQueue(toastId);
          } else {
            state.toasts.forEach((toast) => {
              addToRemoveQueue(toast.id);
            });
          }
          return {
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === toastId || toastId === undefined
                ? {
                    ...t,
                    open: false,
                  }
                : t
            ),
          };
        }
        case 'REMOVE_TOAST':
          if (action.toastId === undefined) {
            return {
              ...state,
              toasts: [],
            };
          }
          return {
            ...state,
            toasts: state.toasts.filter((t) => t.id !== action.toastId),
          };
      }
    };
    const listeners = [];
    let memoryState = {
      toasts: [],
    };
    function dispatch(action) {
      memoryState = reducer(memoryState, action);
      listeners.forEach((listener) => {
        listener(memoryState);
      });
    }
    function toast(props) {
      const id = genId();
      const update = (props) =>
        dispatch({
          type: 'UPDATE_TOAST',
          toast: {
            ...props,
            id,
          },
        });
      const dismiss = () =>
        dispatch({
          type: 'DISMISS_TOAST',
          toastId: id,
        });
      dispatch({
        type: 'ADD_TOAST',
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss();
          },
        },
      });
      return {
        id: id,
        dismiss,
        update,
      };
    }
    function useToast() {
      _s();
      const [state, setState] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ](memoryState);
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'useToast.useEffect': () => {
            listeners.push(setState);
            return {
              'useToast.useEffect': () => {
                const index = listeners.indexOf(setState);
                if (index > -1) {
                  listeners.splice(index, 1);
                }
              },
            }['useToast.useEffect'];
          },
        }['useToast.useEffect'],
        [state]
      );
      return {
        ...state,
        toast,
        dismiss: (toastId) =>
          dispatch({
            type: 'DISMISS_TOAST',
            toastId,
          }),
      };
    }
    _s(useToast, 'SPWE98mLGnlsnNfIwu/IAKTSZtk=');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/ui/toaster.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Toaster', () => Toaster]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/toast.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/use-toast.ts [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function Toaster() {
      _s();
      const { toasts } = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useToast'
      ])();
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'ToastProvider'
        ],
        {
          children: [
            toasts.map(function ({ id, title, description, action, ...props }) {
              return /*#__PURE__*/ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxDEV'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Toast'
                ],
                {
                  ...props,
                  children: [
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      'div',
                      {
                        className: 'grid gap-1',
                        children: [
                          title &&
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'ToastTitle'
                              ],
                              {
                                children: title,
                              },
                              void 0,
                              false,
                              {
                                fileName: '[project]/apps/frontend/components/ui/toaster.tsx',
                                lineNumber: 22,
                                columnNumber: 25,
                              },
                              this
                            ),
                          description &&
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'ToastDescription'
                              ],
                              {
                                children: description,
                              },
                              void 0,
                              false,
                              {
                                fileName: '[project]/apps/frontend/components/ui/toaster.tsx',
                                lineNumber: 24,
                                columnNumber: 17,
                              },
                              this
                            ),
                        ],
                      },
                      void 0,
                      true,
                      {
                        fileName: '[project]/apps/frontend/components/ui/toaster.tsx',
                        lineNumber: 21,
                        columnNumber: 13,
                      },
                      this
                    ),
                    action,
                    /*#__PURE__*/ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxDEV'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'ToastClose'
                      ],
                      {},
                      void 0,
                      false,
                      {
                        fileName: '[project]/apps/frontend/components/ui/toaster.tsx',
                        lineNumber: 28,
                        columnNumber: 13,
                      },
                      this
                    ),
                  ],
                },
                id,
                true,
                {
                  fileName: '[project]/apps/frontend/components/ui/toaster.tsx',
                  lineNumber: 20,
                  columnNumber: 11,
                },
                this
              );
            }),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsxDEV'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'ToastViewport'
              ],
              {},
              void 0,
              false,
              {
                fileName: '[project]/apps/frontend/components/ui/toaster.tsx',
                lineNumber: 32,
                columnNumber: 7,
              },
              this
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: '[project]/apps/frontend/components/ui/toaster.tsx',
          lineNumber: 17,
          columnNumber: 5,
        },
        this
      );
    }
    _s(Toaster, '1YTCnXrq2qRowe0H/LBWLjtXoYc=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useToast'
        ],
      ];
    });
    _c = Toaster;
    var _c;
    __turbopack_context__.k.register(_c, 'Toaster');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/i18n/LocaleHtmlSync.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['LocaleHtmlSync', () => LocaleHtmlSync]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function LocaleHtmlSync() {
      _s();
      const locale = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useLocale'
      ])();
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'LocaleHtmlSync.useEffect': () => {
            document.documentElement.lang = locale;
          },
        }['LocaleHtmlSync.useEffect'],
        [locale]
      );
      return null;
    }
    _s(LocaleHtmlSync, 'ntUoKGquFeVY03p7+iawWbpR3vA=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useLocale'
        ],
      ];
    });
    _c = LocaleHtmlSync;
    var _c;
    __turbopack_context__.k.register(_c, 'LocaleHtmlSync');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
]);

//# sourceMappingURL=_7b250d4f._.js.map
