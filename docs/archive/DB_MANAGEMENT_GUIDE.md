# 데이터베이스 관리 가이드

**업데이트**: 2026-01-22
**Drizzle Kit**: v0.31.8

---

## 🎯 핵심 명령어

### 개발 중 (권장)

```bash
# 스키마 파일 수정 후 자동으로 DB에 반영
pnpm db:push
```

### 수동 마이그레이션 적용

```bash
# manual/ 폴더의 SQL 파일을 모든 DB에 적용
pnpm db:sync
```

### 프로덕션 배포 (나중에)

```bash
# 마이그레이션 파일 생성
cd apps/backend
pnpm db:generate

# 프로덕션 DB에 적용
pnpm db:migrate
```

---

## 📚 상세 가이드

### 1. 스키마 변경 워크플로우

#### ✅ 권장 방법 (Drizzle Push)

```bash
# 1. 스키마 파일 수정
vim packages/db/src/schema/equipment.ts

# 2. 변경사항 자동 적용
pnpm db:push

# 3. 테스트 실행
pnpm test:e2e
```

**장점**:

- ✅ 빠른 개발 속도
- ✅ SQL 파일 작성 불필요
- ✅ 자동으로 두 DB 동기화 (개발 + 테스트)

**주의사항**:

- ⚠️ 개발/테스트 환경 전용
- ⚠️ 프로덕션에는 사용하지 말 것

#### 📝 대체 방법 (수동 마이그레이션)

```bash
# 1. SQL 파일 작성
vim apps/backend/drizzle/manual/YYYYMMDD_description.sql

# 2. 모든 DB에 적용
pnpm db:sync
```

**사용 시기**:

- 복잡한 데이터 마이그레이션
- 조건부 ALTER TABLE
- 프로덕션 배포 준비

### 2. DB 환경

#### 개발 DB (포트 5433)

- **용도**: 로컬 개발
- **데이터**: 개발 중인 실제 데이터
- **컨테이너**: `postgres_equipment`

#### 테스트 DB (포트 5434)

- **용도**: E2E 테스트
- **데이터**: 테스트 실행 시 자동 생성/삭제
- **컨테이너**: `postgres_equipment_test`

### 3. 트러블슈팅

#### 스키마 불일치 오류

```bash
ERROR: column "xxx" does not exist
```

**해결 방법**:

```bash
# 자동 동기화 (권장)
pnpm db:push

# 또는 수동 마이그레이션 적용
pnpm db:sync
```

#### 마이그레이션 충돌

```bash
ERROR: relation "xxx" already exists
```

**해결 방법**:

```bash
# SQL 파일에 IF NOT EXISTS 추가
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS new_column VARCHAR(50);
```

---

## 🔧 내부 동작 원리

### pnpm db:push 스크립트

```bash
# 1. 개발 DB 동기화
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/equipment_management" \
  drizzle-kit push

# 2. 테스트 DB 동기화
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/equipment_management_test" \
  drizzle-kit push
```

### pnpm db:sync 스크립트

```bash
# manual/ 폴더의 모든 SQL 파일을
# 개발 DB + 테스트 DB에 순차적으로 적용
for migration in manual/*.sql; do
  docker exec -i postgres_equipment psql ...
  docker exec -i postgres_equipment_test psql ...
done
```

---

## 📋 체크리스트

### 새로운 기능 개발 시

- [ ] 스키마 파일 수정
- [ ] `pnpm db:push` 실행
- [ ] 테스트 작성/실행
- [ ] 코드 작성
- [ ] E2E 테스트 실행

### 프로덕션 배포 시

- [ ] 스키마 변경사항 검토
- [ ] `pnpm db:generate` - 마이그레이션 생성
- [ ] 생성된 SQL 파일 검토
- [ ] 프로덕션 DB 백업
- [ ] `pnpm db:migrate` - 마이그레이션 적용
- [ ] 배포 후 검증

---

## 🚫 하지 말아야 할 것

### ❌ 프로덕션에서 drizzle-kit push 사용

```bash
# 절대 금지!
DATABASE_URL="프로덕션_DB_URL" drizzle-kit push
```

**이유**: 데이터 손실 위험

### ❌ 수동으로 DB 스키마 변경

```bash
# 금지!
docker exec postgres_equipment psql -c "ALTER TABLE ..."
```

**이유**: 스키마 파일과 불일치 발생

### ❌ 테스트 DB를 개발용으로 사용

```bash
# 금지!
DATABASE_URL="postgresql://localhost:5434/equipment_management_test" npm run dev
```

**이유**: 테스트 실행 시 데이터 삭제됨

---

## 📖 참고 자료

- [Drizzle Kit 공식 문서](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle Push vs Generate](https://orm.drizzle.team/kit-docs/overview#prototyping-with-db-push)
- [프로젝트 DB 스키마 파일](packages/db/src/schema/)
- [수동 마이그레이션 폴더](apps/backend/drizzle/manual/)

---

## 🆘 도움말

### 명령어 도움말

```bash
# Drizzle Kit 도움말
npx drizzle-kit --help

# Push 명령어 도움말
npx drizzle-kit push --help
```

### 문제 발생 시

1. `pnpm db:push` 재실행
2. Docker 컨테이너 상태 확인: `docker ps`
3. 로그 확인: `docker logs postgres_equipment`
4. 최후의 수단: DB 재생성
   ```bash
   docker-compose down -v
   docker-compose up -d
   pnpm db:sync
   ```
