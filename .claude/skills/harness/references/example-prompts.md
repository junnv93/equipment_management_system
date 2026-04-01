# Harness Example Prompts — 도메인별 실전 사용 예시

## 사용법

```
/harness [아래 프롬프트 중 하나]
```

모드를 명시하지 않으면 하네스가 자동 판별합니다.

---

## 장비 관리 (Equipment)

### Mode 0 — Direct

```
장비 상세 페이지에서 "제조사" 라벨을 "제조업체"로 변경해줘
```

```
equipment 목록의 i18n 번역 누락된 키 3개 추가해줘:
- equipment.filter.allSites
- equipment.filter.allClassifications  
- equipment.badge.calibrationDue
```

### Mode 1 — Lightweight

```
장비 목록에 "최근 교정일" 컬럼을 추가해줘.
백엔드에서 calibrations 테이블과 JOIN해서 가져오고,
프론트엔드 테이블에 컬럼 추가해줘.
```

```
장비 상세 페이지의 "기본정보" 탭에 QR 코드 생성 버튼을 추가해줘.
관리번호를 QR로 인코딩해서 PNG로 다운로드할 수 있게.
```

```
장비 검색에 "관리번호" 부분 검색을 추가해줘.
현재는 정확 일치만 되는데, LIKE 검색으로 변경하고
verify-sql-safety의 와일드카드 이스케이프 규칙을 준수해줘.
```

### Mode 2 — Full Harness

```
장비 위치 추적 시스템을 구현해줘.
- 장비별 현재 위치와 이동 이력 관리
- location_history 테이블 생성
- 위치 변경 시 알림 발송
- 장비 상세 페이지에 위치 이력 탭 추가
- 위치별 장비 현황 대시보드 위젯
```

```
장비 대량 등록 기능을 구현해줘.
- Excel 템플릿 다운로드 → 작성 → 업로드 흐름
- 업로드 시 Zod 검증 + 중복 관리번호 체크
- 검증 결과 미리보기 (성공/실패 행 구분)
- 확정 시 트랜잭션으로 일괄 INSERT
- 진행률 표시 (SSE 또는 폴링)
```

---

## 교정 관리 (Calibration)

### Mode 0

```
교정 이력 탭에서 날짜 포맷을 YYYY-MM-DD에서 YYYY.MM.DD로 변경해줘
```

### Mode 1

```
교정 등록 시 "교정 주기" 필드를 추가해줘.
- 백엔드: calibrations 테이블에 calibration_interval_months 컬럼 추가
- DTO에 Zod 검증 (1~120 범위)
- 프론트엔드: 교정 등록 폼에 숫자 입력 필드 추가
- 다음 교정 예정일을 자동 계산해서 표시
```

```
교정 성적서 PDF 미리보기 기능을 추가해줘.
현재는 다운로드만 되는데, 모달에서 PDF를 바로 볼 수 있게.
DocumentService의 download API를 활용하고,
브라우저 내장 PDF 뷰어로 렌더링.
```

### Mode 2

```
교정 계획 대시보드를 구현해줘.
- 월별 교정 예정 장비 캘린더 뷰
- 교정 기한 임박 장비 경고 (D-30, D-7, D-1)
- 팀별 교정 부하 분석 차트
- 교정 비용 예측 (이전 교정 비용 기반)
- 새 페이지: /calibration-plans/dashboard
```

---

## 반출 관리 (Checkouts)

### Mode 0

```
반출 목록 테이블의 "반출 목적" 컬럼 너비를 200px로 고정해줘
```

### Mode 1

```
반출 승인 시 이메일 알림을 추가해줘.
- CheckoutsService.approve()에서 승인 완료 후 NotificationsService 호출
- 요청자에게 "반출이 승인되었습니다" 이메일 발송
- EmailTemplateService에 checkout_approved 템플릿 추가
```

```
반출 반려 사유를 필수 입력으로 변경해줘.
- reject DTO에 reason 필드 추가 (min 10자)
- 프론트엔드 반려 다이얼로그에 textarea 추가
- 반려 사유를 반출 상세 페이지에 표시
```

### Mode 2

```
장비 예약 시스템을 구현해줘.
- 장비별 예약 캘린더 (주/월 뷰)
- 예약 충돌 감지 및 경고
- reservations 테이블 생성
- 예약 → 반출 자동 연동 (예약일에 반출 요청 자동 생성)
- 예약 현황 대시보드 위젯
```

---

## 부적합 관리 (Non-Conformances)

### Mode 0

```
부적합 목록에서 "심각도" 배지 색상을 변경해줘:
- critical → brand-danger (현재 red-500 하드코딩)
```

### Mode 1

```
부적합 시정 조치에 첨부파일 기능을 추가해줘.
- DocumentService 활용 (기존 문서 관리 인프라 재사용)
- 시정 조치 제출 시 증빙 사진/문서 첨부 가능
- 부적합 상세 페이지에 첨부파일 목록 표시
```

```
부적합 통계 API를 추가해줘.
- 월별 부적합 발생 건수 (유형별)
- 평균 시정 소요일
- 팀별 부적합 발생률
- 대시보드 통계 카드에 연동
```

### Mode 2

```
CAPA (시정 및 예방 조치) 관리 모듈을 구현해줘.
- corrective_actions 테이블 생성
- 부적합 → CAPA 연동 (1:N)
- CAPA 진행 상태 추적 (등록→조사→시정→검증→완료)
- 2단계 승인 (TM → LM)
- CAPA 효과성 평가 기록
- 보고서: CAPA 현황 + 효과성 분석
```

---

## 승인 관리 (Approvals)

### Mode 0

```
승인 대기 카운트 배지에 pulse 애니메이션 제거해줘 (10개 미만일 때)
```

### Mode 1

```
승인 일괄 처리 기능을 추가해줘.
- 승인 목록에서 체크박스로 여러 건 선택
- "선택 승인" / "선택 반려" 버튼
- 백엔드: POST /api/approvals/batch-approve (CAS 개별 적용)
- 실패한 건은 결과에 표시 (부분 성공 허용)
```

### Mode 2

```
승인 위임 시스템을 구현해줘.
- 부재 시 승인 ���한을 다른 사용자에게 위임
- approval_delegations 테이블 (delegator, delegate, start_date, end_date)
- 위임 기간 동안 대리 승인자에게 알림 라우팅
- 위임 이력 감사 로그
- 설정 페이지에 위임 관리 UI
```

---

## 소프트웨어 관리 (Software)

### Mode 0

```
소프트웨어 목록 테이블에서 "버전" 컬럼 정렬을 semver 기준으로 변경해줘
```

### Mode 1

```
소프트웨어 라이선스 만료 알림을 추가해줘.
- software 테이블에 license_expiry_date 컬럼 추가
- 만료 30일 전 알림 발송 (CalibrationOverdueScheduler 패턴 참고)
- 소프트웨어 상세 페이지에 만료일 배지 표시
```

### Mode 2

```
소프트웨어 자산 관리 확장을 구현해줘.
- 라이선스 유형별 관리 (subscription, perpetual, open-source)
- 라이선스 키 암호화 저장
- 설치 현황 추적 (장비-소프트웨어 N:M)
- 라이선스 비용 보고서
- 자동 갱신 알림 워크플로우
```

---

## 대시보드 (Dashboard)

### Mode 0

```
대시보드 통계 카드의 로딩 스켈레톤 높이를 실제 카드와 맞춰줘
```

### Mode 1

```
대시보드에 "이번 주 활동 요약" 위젯을 추가해줘.
- 이번 주 등록/수정/폐기된 장비 수
- 이번 주 승인/반려된 건수
- DashboardService에 getWeeklySummary() 추가
- QUERY_CONFIG.DASHBOARD 프리셋 적용
```

### Mode 2

```
맞춤형 대시보드 시스템을 구현해줘.
- 사용자별 위젯 배치 커스터마이징 (드래그 앤 드롭)
- dashboard_layouts 테이블 (user_id, layout_json)
- 기본 레이아웃 + 역할별 기본 레이아웃
- 위젯 라이브러리: 통계 카드, 차트, 최근 활동, 알림 등
- 레이아웃 저장/불러오기
```

---

## 리포트 (Reports)

### Mode 1

```
리포트 내보내기에 날짜 범위 필터를 추가해줘.
- 시작일/종료일 DatePicker 추가
- 백엔드 쿼리에 WHERE created_at BETWEEN 조건 추가
- Excel/PDF 파일명에 날짜 범위 포함
```

### Mode 2

```
맞춤형 리포트 빌더를 구현해줘.
- 데이터 소스 선택 (장비, 교정, 반출, 부적합)
- 컬럼 선택 및 필터 조건 설정
- 그룹화 및 집계 (COUNT, SUM, AVG)
- 리포트 템플릿 저장 및 공유
- 예약 실행 (매주 월요일 이메일 발송)
```

---

## 시스템 설정 (Settings)

### Mode 0

```
설정 페이지의 "저장" 버튼 로딩 상태를 추가해줘 (mutation.isPending)
```

### Mode 1

```
시스템 설정에 "교정 기한 알림 일수" 설정을 추가해줘.
- system_settings 테이블에 calibration_alert_days 키 추가 (기본: [30, 7, 1])
- 설정 페이지에 숫자 배열 입력 UI
- CalibrationOverdueScheduler가 이 설정 값을 참조
```

---

## 크로스 도메인 (Cross-Domain)

### Mode 2

```
감사 로그 검색 및 분석 ���스템을 구현해줘.
- 감사 로그 전문 검색 (Elasticsearch 또는 PostgreSQL FTS)
- 필터: 날짜 범위, 사용자, 엔티티 유형, 액션
- 이상 행동 감지 (동일 사용자 단시간 대량 변경)
- 감사 보고서 PDF 내보내기
- 새 페이지: /admin/audit-logs (기존 페이지 확장)
```

```
다국어(i18n) 관리 시스템을 구현해줘.
- 번역 키 관리 UI (admin 전용)
- 누락 키 자동 감지 및 경고
- 번역 상태 추적 (완료/미완료/검토 필요)
- CSV 내보내기/가져오기 (번역가 협업용)
- 런타임 번역 오버라이드 (DB 기반)
```
