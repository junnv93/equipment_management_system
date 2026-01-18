# AI 에이전트 프롬프트 가이드

효율적이고 일관된 개발을 위한 프롬프트 작성 가이드.

---

## 핵심 원칙

### 1. 컨텍스트 우선

- 항상 AGENTS.md 참조 명시
- 관련 문서 링크 제공
- 현재 작업 중인 파일/모듈 명시

### 2. 구체성

- 모호한 표현 지양
- 구체적인 파일 경로, 함수명, 타입명 명시
- 예상 결과물 명확히 정의

### 3. 제약사항 명시

- API_STANDARDS 준수 강조
- 타입 안전성 요구사항
- 테스트 작성 요구사항

### 4. 검증 방법

- 테스트 실행 명령어
- 린터 체크
- 타입 체크

---

## 효과적인 프롬프트 템플릿

### 템플릿 1: 기능 추가

```
[AGENTS.md 참조] [관련 문서 링크]

[기능 설명]을 구현해줘.

요구사항:
- [구체적 요구사항 1]
- [구체적 요구사항 2]
- [API_STANDARDS 준수]
- [타입 안전성 보장]

파일 위치:
- [생성/수정할 파일 경로]

검증:
- [테스트 작성]
- [타입 체크]
- [린터 통과]
```

### 템플릿 2: 버그 수정

```
[AGENTS.md 참조]

[문제 설명]을 수정해줘.

현재 상황:
- [에러 메시지/증상]
- [관련 파일]

원인 분석:
- [예상 원인]

해결 방향:
- [근본적 해결 방법]
- [중복 제거]
- [일관성 유지]

검증:
- [재현 테스트]
- [회귀 테스트]
```

### 템플릿 3: 리팩토링

```
[AGENTS.md 참조] [API_STANDARDS 참조]

[대상 영역]을 리팩토링해줘.

목표:
- [개선 목표 1]
- [개선 목표 2]

제약사항:
- [하위 호환성 유지]
- [기존 API 변경 금지]
- [테스트 커버리지 유지]

접근 방식:
- [단계별 계획]
- [공통 패턴 추출]
- [중복 제거]

검증:
- [기존 테스트 통과]
- [성능 검증]
```

---

## 실제 사용 예시

### 좋은 프롬프트

```
AGENTS.md와 API_STANDARDS.md를 참조하여 장비 대여 승인 기능을 구현해줘.

요구사항:
- rentals/manage 페이지에 승인 버튼 추가
- 백엔드 /api/rentals/:uuid/approve 엔드포인트 호출
- 승인 후 목록 자동 갱신
- 에러 처리 및 토스트 알림

파일:
- apps/frontend/app/rentals/manage/page.tsx
- apps/frontend/lib/api/rental-api.ts

제약사항:
- useFormSubmission 훅 사용 (공통 패턴)
- Rental 타입은 @equipment-management/schemas에서 import
- API_STANDARDS의 응답 변환 유틸리티 사용

검증:
- 타입 체크 통과
- 린터 통과
- 실제 동작 확인
```

### 나쁜 프롬프트

```
대여 승인 기능 만들어줘
```

문제점:

- 컨텍스트 부족
- 구체성 부족
- 검증 방법 없음
- 제약사항 없음

---

## 프롬프트 작성 체크리스트

### 필수 요소

- [ ] AGENTS.md 참조 명시
- [ ] 관련 문서 링크 (API_STANDARDS, 관련 가이드라인)
- [ ] 구체적인 파일 경로
- [ ] 명확한 요구사항
- [ ] 제약사항 명시
- [ ] 검증 방법

### 권장 요소

- [ ] 예상 결과물 설명
- [ ] 우선순위 명시
- [ ] 관련 이슈/컨텍스트
- [ ] 성능 요구사항
- [ ] 접근성 고려사항

---

## 도메인별 프롬프트 패턴

### 백엔드 작업

```
[apps/backend/AGENTS.md 참조]

[기능]을 구현해줘.

모듈: [module-name]
- Controller: [endpoint 정의]
- Service: [비즈니스 로직]
- DTO: [Zod 스키마 사용]

제약사항:
- Drizzle 스키마는 packages/db에서 import
- Zod 검증은 packages/schemas에서 import
- Controller는 Service만 호출
- JWT 인증 가드 적용

테스트:
- Service 단위 테스트
- Controller E2E 테스트
```

### 프론트엔드 작업

```
[apps/frontend/AGENTS.md 참조]

[기능]을 구현해줘.

페이지/컴포넌트: [경로]
- [구체적 요구사항]

제약사항:
- React Query로 서버 상태 관리
- shadcn/ui 컴포넌트 사용
- 타입은 @equipment-management/schemas에서 import
- apiClient 사용 (axios 직접 import 금지)

테스트:
- 컴포넌트 테스트
- 타입 체크
```

### 스키마 작업

```
[packages/schemas/AGENTS.md 참조]

[엔티티] 스키마를 추가/수정해줘.

요구사항:
- [필드 정의]
- [검증 규칙]

제약사항:
- Zod 스키마로 정의
- TypeScript 타입은 z.infer로 추론
- z.coerce.date() 사용 (API 호환성)
- 테스트 작성

영향 범위:
- [백엔드 DTO 업데이트 필요 여부]
- [프론트엔드 폼 업데이트 필요 여부]
```

---

## 고급 프롬프트 패턴

### 다단계 작업

```
AGENTS.md를 참조하여 다음 작업을 단계별로 진행해줘:

1단계: [작업 1]
   - 파일: [경로]
   - 검증: [방법]

2단계: [작업 2]
   - 파일: [경로]
   - 검증: [방법]

3단계: [통합 테스트]
   - 검증: [방법]

각 단계 완료 후 다음 단계로 진행.
```

### 비교 분석 요청

```
AGENTS.md와 [기준 파일]을 참조하여 [대상 파일]을 분석하고 개선해줘.

분석 항목:
- 코드 일관성
- 패턴 준수
- 중복 코드
- 타입 안전성

개선 방향:
- [구체적 개선 사항]
```

---

## 피해야 할 표현

### 모호한 표현

- "좋게 만들어줘"
- "최적화해줘"
- "개선해줘"

### 구체적 표현으로 대체

- "코드 중복을 제거하고 공통 훅으로 추출해줘"
- "렌더링 성능을 개선하기 위해 React.memo와 useMemo를 적용해줘"
- "API_STANDARDS에 맞게 응답 변환 로직을 통일해줘"

---

## 효과적인 프롬프트 작성 순서

1. **컨텍스트 설정**

   - AGENTS.md 참조 명시
   - 관련 문서 링크

2. **작업 정의**

   - 구체적인 작업 내용
   - 예상 결과물

3. **제약사항 명시**

   - 표준 준수
   - 아키텍처 제약

4. **구현 지침**

   - 파일 경로
   - 사용할 패턴/훅/컴포넌트

5. **검증 방법**
   - 테스트
   - 타입 체크
   - 린터

---

## 실제 대화 예시

### 시나리오 1: 새 기능 추가

**사용자:**

```
AGENTS.md와 API_STANDARDS.md를 참조하여 장비 교정 등록 기능을 구현해줘.

요구사항:
- /calibration/register 페이지에 교정 등록 폼 추가
- 장비 선택 (EquipmentSelector 컴포넌트 재사용)
- 교정일, 차기교정일, 교정기관 입력
- 백엔드 /api/calibrations POST 엔드포인트 호출

파일:
- apps/frontend/app/calibration/register/page.tsx
- apps/frontend/lib/api/calibration-api.ts (필요시)

제약사항:
- useFormSubmission 훅 사용
- CreateCalibrationInput 타입은 @equipment-management/schemas에서 import
- API_STANDARDS의 응답 변환 유틸리티 사용

검증:
- 타입 체크 통과
- 실제 동작 확인
```

### 시나리오 2: 버그 수정

**사용자:**

```
AGENTS.md를 참조하여 타입 오류를 수정해줘.

문제:
- rental.equipmentName이 존재하지 않음
- Rental 타입은 equipment 객체를 포함

파일:
- apps/frontend/app/rentals/manage/page.tsx

해결 방향:
- rental.equipment?.name 패턴으로 통일
- 검색 로직도 중첩 객체 구조로 수정
- 다른 페이지와 일관성 유지

검증:
- 타입 체크 통과
- 린터 통과
```

### 시나리오 3: 리팩토링

**사용자:**

```
AGENTS.md와 API_STANDARDS.md를 참조하여 create 페이지들의 중복 코드를 제거해줘.

대상:
- apps/frontend/app/rentals/create/page.tsx
- apps/frontend/app/checkouts/create/page.tsx
- apps/frontend/app/maintenance/create/page.tsx

목표:
- 장비 선택 로직 공통화
- 폼 제출 로직 공통화
- 각 페이지의 특수 요구사항은 유지

접근:
- 공통 컴포넌트/훅 생성
- 점진적 적용 (rentals부터)
- 테스트 작성

검증:
- 기존 기능 동작 확인
- 타입 안전성 보장
```

---

## 프롬프트 최적화 팁

### 1. 단계별 요청

큰 작업은 작은 단계로 나누어 요청:

- "1단계: 공통 훅 생성"
- "2단계: 첫 번째 페이지 적용"
- "3단계: 나머지 페이지 적용"

### 2. 컨텍스트 제공

관련 파일이나 문서를 함께 제공:

- "rentals/create/page.tsx를 참고하여..."
- "API_STANDARDS.md의 응답 구조를 따라..."

### 3. 제약사항 명시

원하지 않는 방향을 명확히:

- "단편적 수정 금지, 근본적 해결"
- "중복 코드 생성 금지"
- "하위 호환성 유지"

### 4. 검증 요구

구체적인 검증 방법:

- "pnpm tsc --noEmit 실행하여 타입 체크"
- "기존 테스트가 모두 통과하는지 확인"
- "실제 브라우저에서 동작 확인"

---

## 효과적인 프롬프트 키워드

### 강제 키워드

- "AGENTS.md 준수"
- "API_STANDARDS 준수"
- "근본적 해결"
- "일관성 유지"
- "중복 제거"

### 방향 지시 키워드

- "재사용 가능한 컴포넌트로"
- "공통 훅으로 추출"
- "타입 안전성 보장"
- "테스트 작성"

### 제약 키워드

- "단편적 수정 금지"
- "하위 호환성 유지"
- "기존 API 변경 금지"

---

End of PROMPT_GUIDE.md
