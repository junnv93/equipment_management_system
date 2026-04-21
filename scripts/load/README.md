# k6 부하 테스트 — Software Validation

Software Validation 도메인 hot path 2종에 대한 k6 부하 테스트 스크립트.

## 설치

```bash
# macOS
brew install k6

# Windows (winget)
winget install k6 --source winget

# Ubuntu/Debian
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## 환경변수

| 변수               | 필수              | 기본값                  | 설명                            |
| ------------------ | ----------------- | ----------------------- | ------------------------------- |
| `API_BASE`         | 아니오            | `http://localhost:3001` | 백엔드 base URL                 |
| `K6_USER_EMAIL`    | 예                | —                       | 로그인 이메일                   |
| `K6_USER_PASSWORD` | 예                | —                       | 로그인 비밀번호                 |
| `K6_VALIDATION_ID` | export 스크립트만 | —                       | 테스트 DB의 validationId (UUID) |

`K6_VALIDATION_ID` 는 DB에 실제 존재하는 row의 UUID여야 합니다.  
Drizzle Studio (`pnpm --filter backend run db:studio`) 에서 `software_validations` 테이블을 열어 임의의 `id` 를 복사하세요.

## 실행

```bash
# List 테스트 (백엔드 서버 먼저 구동: pnpm dev)
K6_USER_EMAIL=test@example.com K6_USER_PASSWORD=password \
  k6 run scripts/load/software-validation-list.k6.js

# Export 테스트
K6_USER_EMAIL=test@example.com K6_USER_PASSWORD=password \
K6_VALIDATION_ID=<uuid-here> \
  k6 run scripts/load/software-validation-export.k6.js
```

## 성능 목표

| 스크립트 | 지표          | 목표                      |
| -------- | ------------- | ------------------------- |
| list     | p95 응답 시간 | < 500ms                   |
| list     | 오류율        | < 1%                      |
| export   | p95 응답 시간 | < 2000ms (DOCX 생성 포함) |
| export   | 오류율        | < 2%                      |

## 결과 해석

k6 출력에서 아래 지표를 확인하세요:

```
✓ http_req_duration{type:list}......: p(95)=432ms  ← 500ms 미만 목표
✓ http_req_failed{type:list}........: 0.00%        ← 1% 미만 목표
```

### p95 위반 시 원인 체크리스트

**list (`p95 > 500ms`)**

- [ ] DB 인덱스 누락: `software_validations` 테이블의 `site_id`, `status` 컬럼 인덱스 확인
- [ ] N+1 쿼리: 목록 조회 시 item별 추가 쿼리 발생 여부 확인 (Drizzle query log 활성화)
- [ ] Redis 캐시 미적중: 캐시 hit rate 확인 (`pnpm --filter backend run dev` 로그 참조)
- [ ] Connection pool 고갈: `pg_stat_activity` 에서 waiting 커넥션 확인

**export (`p95 > 2000ms`)**

- [ ] DOCX 템플릿 파일 I/O: 스토리지 provider latency 확인 (로컬 개발은 local FS, 프로덕션은 S3)
- [ ] 서명 이미지 다운로드: presigned URL fetch 타임아웃 확인
- [ ] 대용량 데이터: validation에 첨부된 함수 항목 수가 비정상적으로 많은 경우
- [ ] DB slow query: `EXPLAIN ANALYZE` 로 export 쿼리 플랜 확인
