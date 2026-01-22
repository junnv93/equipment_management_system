# 사용자 역할 체계 (UL-QP-18 Section 4)

## 목차

1. [역할 정의](#역할-정의)
2. [역할별 권한 매트릭스](#역할별-권한-매트릭스)
3. [절차서 기반 책임](#절차서-기반-책임)
4. [Azure AD 매핑](#azure-ad-매핑)
5. [코드 구현](#코드-구현)

---

## 역할 정의

### 시험실무자 (test_engineer)

**절차서 역할**: 시험실무자 (Test Engineer)

**UL-QP-18 Section 4.5 책임**:
- 장비의 운영 및 유지 관리
- 장비의 주기적인 점검 실시
- 시험설비 관리대장 작성 (UL-QP-18-01)
- 장비 이상 발생시 사용중지 식별표 부착 및 원인 파악, 보고
- 신규 장비의 입고 검수 및 장비관리표 부착
- 시험설비이력카드 작성 (UL-QP-18-02)
- 장비 반·출입 확인서 작성 (UL-QP-18-06)
- 공용 장비 사용/반납 확인서 작성 (UL-QP-18-10)

**시스템 권한**:
- 장비 등록/수정/삭제 요청 (승인 필요)
- 대여 신청
- 반출 신청
- 교정 기록 등록 (승인 필요)
- 점검 기록 등록
- 보정계수 변경 요청 (승인 필요)
- 부적합 발견 및 등록

**제한 사항**:
- 자신의 팀 장비만 수정 가능
- 다른 팀 장비 반출 신청/승인 불가
- 교정 기록 직접 승인 불가

---

### 기술책임자 (technical_manager)

**절차서 역할**: 기술책임자 (Technical Manager)

**UL-QP-18 Section 4.4 책임**:
- 장비 유지 관리에 대한 총괄 책임
- 장비의 용도, 정밀도 및 오차 범위에 대한 보장
- 장비의 점검 결과 확인
- 장비에 대한 연간 교정계획 수립
- 장비 반·출입 확인서 승인 (UL-QP-18-06)
- 공용 장비 사용/반납 확인서 승인 (UL-QP-18-10)
- 시험용 소프트웨어 유효성 확인 (UL-QP-18-09)
- 보정인자 및 파라미터 관리 (UL-QP-18-11)

**추가 책임 (Section 7, 8, 9, 10)**:
- 시험실무자 자격 부여 감독, 교육훈련보고서 작성
- 점검 대상 장비 및 점검 항목/주기 결정
- 부적합 장비 중요도 평가 및 재시험 지시
- 부적합 사항 시험설비 이력카드 기록 관리

**시스템 권한**:
- 시험실무자의 모든 권한
- 장비 등록/수정/삭제 승인/반려
- 교정 기록 직접 등록 (registrarComment 필수, 즉시 승인)
- 교정 기록 승인 (approverComment 필수)
- 대여/반출 승인/반려 (모든 목적 1단계 승인)
- 보정계수 변경 승인
- 부적합 장비 사용 재개 승인
- 교정계획서 작성 및 항목 확인

**특별 규칙**:
- 교정 기록 직접 등록 시 `registrarComment` 필수
- 승인 시 `approverComment` 필수
- 자체 승인 불가 (본인 요청은 다른 기술책임자가 승인)

---

### 시험소장/시험소 관리자 (lab_manager)

**절차서 역할**: 시험소장 (Lab Manager)

**UL-QP-18 Section 4.2 책임**:
- 시험 전반에 대한 총괄 책임
- 시험 결과의 품질보증에 대한 총괄 책임
- 장비에 대한 연간 교정계획 **승인**
- 장비폐기의 **승인**

**시스템 권한**:
- 기술책임자의 모든 권한
- 교정계획서 최종 승인
- 장비 폐기 승인
- 해당 시험소 내 모든 팀 데이터 조회/관리
- 해당 시험소 내 사용자 역할 관리

**사이트별 할당**:
- 시험소별 1명씩 할당
- **해당 사이트 내에서만** 관리 권한 행사
- 다른 시험소 데이터 수정 불가

**제한 사항**:
- 자체 승인 불가 (본인 요청은 다른 시험소 관리자 또는 시스템 관리자 승인 필요)
- 시스템 전체 설정 변경 불가

---

### 시스템 관리자 (system_admin)

**절차서 역할**: 시스템 관리자 (System Admin, UL-QP-18 Section 4.1)

**UL-QP-18 Section 4.1 책임**:
- 장비관리시스템 관리

**시스템 권한**:
- 시험소 관리자의 모든 권한
- **자체 승인 가능** (본인 요청 직접 승인)
- 모든 시험소 데이터 조회/관리
- 시스템 설정 관리
- 사용자 역할 할당/변경
- 백업/복원 관리
- 감사 로그 조회

**특별 권한**:
- 사이트 제한 없이 모든 데이터 접근
- 긴급 상황 시 모든 승인 처리 가능
- 시스템 유지보수 작업

---

### 품질 책임자 (quality_manager) - 참조용

**절차서 역할**: 품질 책임자 (Quality Manager, UL-QP-18 Section 4.3)

**참고**: 현재 시스템에서는 별도 역할로 구현하지 않음. 필요시 추가 구현.

**절차서 책임**:
- 문서 양식 검토
- 기록 양식 검토
- 규정된 양식 사용 여부 검토

---

## 역할별 권한 매트릭스

| 기능 | test_engineer | technical_manager | lab_manager | system_admin |
|------|:-------------:|:-----------------:|:----------:|:------------:|
| **장비 관리** |
| 장비 조회 | ✅ (사이트 내) | ✅ (전체) | ✅ (전체) | ✅ (전체) |
| 장비 등록 요청 | ✅ | ✅ | ✅ | ✅ |
| 장비 등록 승인 | ❌ | ✅ (팀 내) | ✅ (사이트) | ✅ (자체 가능) |
| 장비 수정 요청 | ✅ (팀 내) | ✅ (팀 내) | ✅ (사이트) | ✅ |
| 장비 수정 승인 | ❌ | ✅ (팀 내) | ✅ (사이트) | ✅ |
| 장비 폐기 승인 | ❌ | ❌ | ✅ (사이트) | ✅ |
| **대여/반출** |
| 대여 신청 | ✅ | ✅ | ✅ | ✅ |
| 대여 승인 | ✅ (소유팀) | ✅ (소유팀) | ✅ (사이트) | ✅ |
| 반출 신청 | ✅ | ✅ | ✅ | ✅ |
| 반출 승인 (내부) | ❌ | ✅ (팀 내) | ✅ (사이트) | ✅ |
| 반출 승인 (시험소간) | ✅ (1차) | ✅ (최종) | ✅ | ✅ |
| 반입 승인 | ❌ | ✅ | ✅ | ✅ |
| **교정/점검** |
| 교정 기록 등록 | ✅ (승인필요) | ✅ (즉시승인) | ✅ (즉시승인) | ✅ (즉시승인) |
| 교정 기록 승인 | ❌ | ✅ | ✅ | ✅ |
| 점검 기록 등록 | ✅ | ✅ | ✅ | ✅ |
| 점검 결과 확인 | ❌ | ✅ | ✅ | ✅ |
| **교정계획서** |
| 교정계획서 작성 | ❌ | ✅ | ✅ | ✅ |
| 교정계획서 항목 확인 | ❌ | ✅ | ✅ | ✅ |
| 교정계획서 최종 승인 | ❌ | ❌ | ✅ (사이트) | ✅ |
| **보정계수** |
| 보정계수 변경 요청 | ✅ | ✅ | ✅ | ✅ |
| 보정계수 변경 승인 | ❌ | ✅ | ✅ | ✅ |
| **부적합** |
| 부적합 등록 | ✅ | ✅ | ✅ | ✅ |
| 부적합 종료 승인 | ❌ | ✅ | ✅ | ✅ |
| **소프트웨어** |
| 소프트웨어 변경 요청 | ✅ | ✅ | ✅ | ✅ |
| 소프트웨어 변경 승인 | ❌ | ✅ | ✅ | ✅ |
| 소프트웨어 유효성 확인 | ❌ | ✅ | ✅ | ✅ |
| **시스템 관리** |
| 자체 승인 | ❌ | ❌ | ❌ | ✅ |
| 사용자 역할 관리 | ❌ | ❌ | ✅ (사이트) | ✅ |
| 시스템 설정 | ❌ | ❌ | ❌ | ✅ |
| 감사 로그 조회 | ❌ | ❌ | ✅ (사이트) | ✅ |

---

## 절차서 기반 책임

### 장비 관리 인원 (Section 7.1)

> 장비는 교육 및 자격관리 절차서(UL-QP-15)에 따라 시험실무자 자격을 인정 받은 인원이 관리하여야 한다.

```typescript
// 시험실무자 자격 검증
async function validateTestOperatorQualification(userId: string): Promise<boolean> {
  const user = await this.userService.findOne(userId);
  return user.qualifications?.includes('test_engineer') ?? false;
}
```

### 사용 제한 (Section 7.2)

> 장비의 품질 저하 및 남용을 막기 위해 관련된 담당자 이외에 다른 사람의 사용은 금지하여야 한다.

```typescript
// 장비 사용 권한 검증
async function canUseEquipment(equipmentId: string, userId: string): Promise<boolean> {
  const equipment = await this.equipmentService.findOne(equipmentId);
  const user = await this.userService.findOne(userId);

  // 같은 팀이거나 관리자 역할
  return equipment.teamId === user.teamId ||
         ['lab_manager', 'system_admin'].includes(user.role);
}
```

---

## Azure AD 매핑

### 팀 정보 자동 매핑

Azure AD의 부서(department) 정보를 기반으로 자동 매핑:

```typescript
const TEAM_MAPPING: Record<string, { team: string; site: string }> = {
  'LST.SUW.RF': { team: 'RF', site: 'suwon' },
  'LST.SUW.SAR': { team: 'SAR', site: 'suwon' },
  'LST.SUW.EMC': { team: 'EMC', site: 'suwon' },
  'LST.UIW.RF': { team: 'RF', site: 'uiwang' },
  'LST.UIW.SAR': { team: 'SAR', site: 'uiwang' },
  'LST.UIW.EMC': { team: 'EMC', site: 'uiwang' },
  'LST.UIW.AUTO': { team: 'Automotive', site: 'uiwang' },
  'LST.PYT.BATT': { team: 'Battery', site: 'pyeongtaek' },
  // ...
};
```

### 역할 할당

- 최초 로그인 시 기본 역할: `test_engineer`
- 역할 승격은 `lab_manager` 또는 `system_admin`이 수행

---

## 코드 구현

### Enum 정의

```typescript
export enum UserRoleEnum {
  TEST_ENGINEER = 'test_engineer',
  TECHNICAL_MANAGER = 'technical_manager',
  LAB_MANAGER = 'lab_manager',
  SYSTEM_ADMIN = 'system_admin',
}
```

### 역할 계층

```typescript
export const ROLE_HIERARCHY: Record<UserRoleEnum, number> = {
  [UserRoleEnum.TEST_ENGINEER]: 1,
  [UserRoleEnum.TECHNICAL_MANAGER]: 2,
  [UserRoleEnum.LAB_MANAGER]: 3,
  [UserRoleEnum.SYSTEM_ADMIN]: 4,
};

export function hasRoleOrHigher(userRole: UserRoleEnum, requiredRole: UserRoleEnum): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

### 권한 체크 가드

```typescript
// 컨트롤러에서 역할 체크
@Patch(':uuid/approve')
@Roles(UserRoleEnum.TECHNICAL_MANAGER, UserRoleEnum.LAB_MANAGER, UserRoleEnum.SYSTEM_ADMIN)
async approve(@Param('uuid') uuid: string, @Body() dto: ApproveDto, @CurrentUser() user: User) {
  return this.service.approve(uuid, dto, user);
}

// 서비스에서 세부 권한 체크
async approve(uuid: string, dto: ApproveDto, user: User) {
  const request = await this.findOne(uuid);

  // 시스템 관리자는 자체 승인 가능
  if (user.role === UserRoleEnum.SYSTEM_ADMIN) {
    return this.doApprove(uuid, dto, user);
  }

  // 시험소 관리자는 해당 사이트 내에서만
  if (user.role === UserRoleEnum.LAB_MANAGER) {
    if (request.site !== user.site) {
      throw new ForbiddenException('다른 시험소의 요청은 승인할 수 없습니다');
    }
    // 자체 승인 불가
    if (request.requestedBy === user.id) {
      throw new ForbiddenException('시험소 관리자는 자신의 요청을 승인할 수 없습니다');
    }
    return this.doApprove(uuid, dto, user);
  }

  // 기술책임자는 같은 팀 내에서만
  if (request.teamId !== user.teamId) {
    throw new ForbiddenException('다른 팀의 요청은 승인할 수 없습니다');
  }

  // 자체 승인 불가
  if (request.requestedBy === user.id) {
    throw new ForbiddenException('자신의 요청은 승인할 수 없습니다');
  }

  return this.doApprove(uuid, dto, user);
}
```

### 팀별 권한 체크

```typescript
async checkTeamPermission(equipmentId: string, user: User): Promise<void> {
  const equipment = await this.equipmentService.findOne(equipmentId);

  // 시스템 관리자는 모든 팀 접근 가능
  if (user.role === UserRoleEnum.SYSTEM_ADMIN) {
    return;
  }

  // 시험소 관리자는 해당 사이트 내 모든 팀 접근 가능
  if (user.role === UserRoleEnum.LAB_MANAGER) {
    if (equipment.site !== user.site) {
      throw new ForbiddenException('다른 시험소의 장비에 대한 권한이 없습니다');
    }
    return;
  }

  // 기술책임자/시험실무자는 같은 팀만
  if (equipment.teamId !== user.teamId) {
    throw new ForbiddenException(
      `${user.team?.name}팀은 ${equipment.team?.name}팀 장비에 대한 권한이 없습니다`
    );
  }
}
```
