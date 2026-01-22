# 프로젝트 규칙 (Claude Code 필독)

**목적**: AI 어시스턴트가 동일한 실수를 반복하지 않도록 프로젝트 핵심 규칙 정의

---

## 🚨 중요: 이 파일을 먼저 읽으세요!

코드 작성, 테스트, DB 작업 전에 **반드시 이 파일을 읽고** 규칙을 준수하세요.

---

## 📊 프로젝트 컨텍스트

### 개발 환경
- **개발자**: 1인 개발자
- **개발 + 테스트**: 동일인
- **DB 환경**: **단일 DB (통합)**

### 핵심 결정 사항
```
✅ 개발 DB = 테스트 DB (통합됨)
✅ 포트: 5433
✅ 컨테이너: postgres_equipment
✅ 데이터베이스명: equipment_management
```

---

## 🔴 절대 금지 사항

### 1. 테스트 DB 언급 금지
```bash
❌ postgres_equipment_test
❌ localhost:5434
❌ equipment_management_test
❌ "테스트 DB와 개발 DB를 분리해야..."
```

**이유**:
- 1인 개발 환경
- 개발 데이터 중요하지 않음
- 불필요한 복잡도 제거됨
- **2026-01-22에 통합 완료**

### 2. DB 분리 제안 금지
```
❌ "테스트 격리를 위해 별도 DB를 사용하세요"
❌ "개발 데이터 보호를 위해 테스트 DB 필요"
❌ "두 개의 DB를 관리하면 더 안전합니다"
```

**대신 해야 할 것**:
```
✅ "단일 DB를 사용합니다"
✅ "pnpm db:push로 스키마를 동기화합니다"
✅ "테스트는 개발 DB에서 실행됩니다"
```

### 3. 복잡한 DB 관리 스크립트 작성 금지
```bash
❌ 두 DB에 마이그레이션 적용하는 스크립트
❌ DB별 환경 변수 분기 처리
❌ "모든 DB에 적용" 같은 표현
```

---

## ✅ 필수 규칙

### 1. DB 관련 작업

#### 스키마 변경 시
```bash
# 1. 스키마 파일 수정
vim packages/db/src/schema/equipment.ts

# 2. 단일 DB에 적용
pnpm db:push

# 끝!
```

#### 환경 변수
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/equipment_management
```

**절대로 5434 포트나 _test 데이터베이스 사용하지 말 것!**

### 2. 테스트 관련 작업

#### E2E 테스트
```bash
# 개발 DB를 사용하여 테스트 실행
pnpm test:e2e
```

#### 테스트 DB 언급 방지
```
❌ "테스트 DB 초기화"
✅ "DB 초기화"

❌ "개발 DB와 테스트 DB 동기화"
✅ "DB 스키마 동기화"

❌ "두 DB에 적용"
✅ "DB에 적용"
```

### 3. 문서화

#### 올바른 표현
```markdown
# ✅ 올바름
- 데이터베이스: PostgreSQL (포트 5433)
- DB 관리: `pnpm db:push`
- 환경: 개발 + 테스트 통합 환경

# ❌ 잘못됨
- 개발 DB: 5433, 테스트 DB: 5434
- 두 DB를 동기화하려면...
- 테스트 격리를 위해 별도 DB 사용
```

---

## 📚 승인된 명령어

### DB 관리
```bash
pnpm db:push      # 스키마 자동 동기화 (권장)
pnpm db:sync      # 수동 마이그레이션 적용
```

### 테스트
```bash
pnpm test:e2e     # E2E 테스트 실행 (개발 DB 사용)
pnpm test         # 단위 테스트
```

### Docker
```bash
docker ps                           # 컨테이너 확인 (postgres_equipment만 있어야 함)
docker exec postgres_equipment ...  # DB 작업
```

---

## 🎯 의사결정 가이드

### DB 관련 질문이 나올 때

#### Q: "테스트 DB를 별도로 만들까요?"
**A: 아니요. 단일 DB를 사용합니다. 1인 개발 환경이고 개발 데이터가 중요하지 않아서 통합했습니다.**

#### Q: "개발 DB와 테스트 DB를 동기화해야 하나요?"
**A: 테스트 DB는 없습니다. 단일 DB만 사용합니다.**

#### Q: "테스트 실행 시 개발 데이터가 삭제되지 않나요?"
**A: 1인 개발자이고 개발 데이터가 중요하지 않으므로 문제없습니다. 오히려 단순함이 더 중요합니다.**

#### Q: "CI/CD 환경에서는 어떻게 하나요?"
**A: CI/CD도 단일 DB를 사용합니다. 각 테스트 실행마다 새로운 컨테이너를 생성하므로 격리됩니다.**

---

## 🔍 코드 리뷰 체크리스트

코드 작성/수정 시 다음을 확인하세요:

- [ ] DATABASE_URL에 5434 포트나 _test 사용하지 않았나?
- [ ] "테스트 DB"라는 표현 사용하지 않았나?
- [ ] 스크립트가 두 개의 DB를 가정하고 있지 않나?
- [ ] 문서에 "DB 분리" 관련 내용이 없나?
- [ ] 환경 변수 설정이 단일 DB를 가리키나?

---

## 📝 변경 이력

### 2026-01-22: DB 통합
- **변경**: 테스트 DB 제거, 단일 DB로 통합
- **이유**: 1인 개발, 개발 데이터 중요도 낮음, 관리 복잡도 제거
- **영향**:
  - postgres_equipment_test 컨테이너 제거
  - .env.test 업데이트 (5433 포트 사용)
  - 모든 스크립트 단일 DB 기준으로 수정
  - 문서 업데이트

---

## 💡 트러블슈팅

### "postgres_equipment_test를 찾을 수 없습니다"
**정상입니다.** 테스트 DB 컨테이너는 제거되었습니다. postgres_equipment만 사용합니다.

### "테스트 실행 시 DB 연결 오류"
```bash
# .env.test 확인
cat apps/backend/.env.test

# DATABASE_URL이 5433 포트를 가리켜야 함
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/equipment_management
```

### "drizzle-kit push가 작동하지 않습니다"
```bash
# drizzle-kit 버전 확인 (v0.31.8 이상이어야 함)
npx drizzle-kit --version

# 업데이트
pnpm add -D drizzle-kit@latest
```

---

## 🚀 빠른 참조

### 일상적인 개발
```bash
# 1. 스키마 수정
vim packages/db/src/schema/equipment.ts

# 2. DB 적용
pnpm db:push

# 3. 테스트
pnpm test:e2e
```

### 새 환경 설정
```bash
git clone <repo>
pnpm install
docker-compose up -d      # postgres_equipment만 실행됨
pnpm db:push
```

### 문제 발생 시
```bash
# 1차: 재동기화
pnpm db:push

# 2차: 수동 마이그레이션
pnpm db:sync

# 최후: DB 재생성
docker-compose down -v
docker-compose up -d
pnpm db:sync
```

---

## 📖 관련 문서

- **DB_MANAGEMENT_GUIDE.md** - DB 관리 상세 가이드
- **DB_SCHEMA_FIX_REPORT.md** - 스키마 문제 해결 과정
- **FINAL_IMPROVEMENT_REPORT.md** - 전체 개선 사항
- **README.md** - 프로젝트 개요 및 시작 가이드

---

## ⚠️ AI 어시스턴트에게

**이 파일의 규칙을 절대적으로 준수하세요!**

사용자는 다음과 같은 결정을 내렸습니다:
1. ✅ 1인 개발 환경
2. ✅ 개발 데이터 중요도 낮음
3. ✅ 단일 DB 사용 (통합)
4. ✅ 단순함 > 격리

**절대로 다음을 제안하지 마세요:**
- ❌ "테스트 DB를 분리하는 것이 좋습니다"
- ❌ "개발 데이터 보호를 위해..."
- ❌ "두 DB를 관리하면..."

**대신 이렇게 하세요:**
- ✅ 단일 DB 전제로 답변
- ✅ 단순한 솔루션 제시
- ✅ 프로젝트 컨텍스트 존중

---

**최종 업데이트**: 2026-01-22
**다음 리뷰**: 프로젝트 규모 변경 시
