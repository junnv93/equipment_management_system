---
name: verify-i18n
description: i18n 번역 파일의 일관성을 검증합니다. messages/{en,ko}/*.json 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 도메인명 (equipment, dashboard, audit 등)]'
---

# i18n 번역 일관성 검증

## Purpose

`apps/frontend/messages/` 디렉토리의 번역 파일이 다음 규칙을 준수하는지 검증합니다:

1. **en/ko 키 쌍 일치** — 모든 번역 도메인에서 영어/한국어 파일이 동일한 키 구조를 가져야 함
2. **빈 번역 없음** — 빈 문자열("")로 남겨진 번역 없음
3. **네임스페이스 참조 일관성** — `useTranslations('namespace')` / `getTranslations('namespace')` 호출과 실제 메시지 파일이 일치
4. **누락된 도메인 파일** — en/에 있는 파일이 ko/에도 존재하고 그 반대도 성립

## When to Run

- `apps/frontend/messages/en/*.json` 또는 `apps/frontend/messages/ko/*.json`을 추가/수정한 후
- 새 컴포넌트에서 `useTranslations()` 또는 `getTranslations()`를 사용한 후
- 번역 키를 추가하거나 삭제한 후
- i18n 관련 코드 리뷰 시

## Related Files

| File                                         | Purpose                                   |
| -------------------------------------------- | ----------------------------------------- |
| `apps/frontend/messages/en/approvals.json`   | 승인 도메인 영어 번역                     |
| `apps/frontend/messages/ko/approvals.json`   | 승인 도메인 한국어 번역                   |
| `apps/frontend/messages/en/audit.json`       | 감사 로그 도메인 영어 번역                |
| `apps/frontend/messages/ko/audit.json`       | 감사 로그 도메인 한국어 번역              |
| `apps/frontend/messages/en/auth.json`        | 인증 도메인 영어 번역                     |
| `apps/frontend/messages/ko/auth.json`        | 인증 도메인 한국어 번역                   |
| `apps/frontend/messages/en/calibration.json` | 교정 도메인 영어 번역                     |
| `apps/frontend/messages/ko/calibration.json` | 교정 도메인 한국어 번역                   |
| `apps/frontend/messages/en/checkouts.json`   | 반출 도메인 영어 번역                     |
| `apps/frontend/messages/ko/checkouts.json`   | 반출 도메인 한국어 번역                   |
| `apps/frontend/messages/en/common.json`      | 공통 도메인 영어 번역                     |
| `apps/frontend/messages/ko/common.json`      | 공통 도메인 한국어 번역                   |
| `apps/frontend/messages/en/dashboard.json`   | 대시보드 도메인 영어 번역                 |
| `apps/frontend/messages/ko/dashboard.json`   | 대시보드 도메인 한국어 번역               |
| `apps/frontend/messages/en/equipment.json`   | 장비 도메인 영어 번역                     |
| `apps/frontend/messages/ko/equipment.json`   | 장비 도메인 한국어 번역                   |
| `apps/frontend/messages/en/errors.json`      | 에러 도메인 영어 번역                     |
| `apps/frontend/messages/ko/errors.json`      | 에러 도메인 한국어 번역                   |
| `apps/frontend/messages/en/navigation.json`  | 네비게이션 도메인 영어 번역               |
| `apps/frontend/messages/ko/navigation.json`  | 네비게이션 도메인 한국어 번역             |
| `apps/frontend/messages/en/teams.json`       | 팀 도메인 영어 번역                       |
| `apps/frontend/messages/ko/teams.json`       | 팀 도메인 한국어 번역                     |
| `apps/frontend/lib/i18n/request.ts`          | next-intl 설정 (지원 로케일, 메시지 로더) |
| `apps/frontend/middleware.ts`                | next-intl 미들웨어 (로케일 감지)          |

## Workflow

### Step 1: en/ko 파일 쌍 존재 확인

두 언어 디렉토리에 동일한 파일이 모두 존재하는지 확인합니다.

```bash
# en에 있지만 ko에 없는 파일
comm -23 <(ls apps/frontend/messages/en/ | sort) <(ls apps/frontend/messages/ko/ | sort)
```

```bash
# ko에 있지만 en에 없는 파일
comm -13 <(ls apps/frontend/messages/en/ | sort) <(ls apps/frontend/messages/ko/ | sort)
```

**PASS 기준:** 두 명령어 모두 출력이 없어야 함 (en/ko 파일 목록 완전 일치).

**FAIL 기준:** 어느 한쪽에만 파일이 있으면 누락된 쪽에 파일 추가 필요.

### Step 2: 도메인별 en/ko 키 쌍 일치 확인

각 도메인 파일의 JSON 키 구조가 en/ko 간에 완전히 일치하는지 확인합니다.

```bash
# 모든 도메인 파일의 en/ko 키 불일치 탐지
for f in $(ls apps/frontend/messages/en/*.json); do
  key=$(basename $f)
  result=$(diff \
    <(jq -r 'path(..) | join(".")' "$f" | sort) \
    <(jq -r 'path(..) | join(".")' "apps/frontend/messages/ko/$key" | sort) \
    2>/dev/null)
  if [ -n "$result" ]; then
    echo "MISMATCH: $key"
    echo "$result" | head -10
  fi
done
echo "키 검사 완료"
```

**PASS 기준:** 모든 도메인에서 "MISMATCH" 출력 없음.

**FAIL 기준:** 특정 도메인에서 키 불일치가 발견되면:

- `< key` (en에만 있음) → ko 파일에도 해당 키 추가 필요
- `> key` (ko에만 있음) → en 파일에도 해당 키 추가 필요

**권장 패턴:**

```json
// ✅ en/ko 동일 구조
// en/equipment.json
{ "title": "Equipment", "list": { "createButton": "Add Equipment" } }
// ko/equipment.json
{ "title": "장비", "list": { "createButton": "장비 추가" } }

// ❌ 구조 불일치
// en/equipment.json
{ "title": "Equipment", "list": { "createButton": "Add Equipment", "createSharedButton": "Add Shared" } }
// ko/equipment.json — createSharedButton 누락
{ "title": "장비", "list": { "createButton": "장비 추가" } }
```

### Step 3: 빈 번역 값 탐지

비어 있는 번역 문자열("")을 탐지합니다.

```bash
# 빈 번역 값 탐지 (en)
grep -rn '": ""' apps/frontend/messages/en/ | grep -v "node_modules\|// " | head -20
```

```bash
# 빈 번역 값 탐지 (ko)
grep -rn '": ""' apps/frontend/messages/ko/ | grep -v "node_modules\|// " | head -20
```

**PASS 기준:** 0개 결과 (빈 번역 없음).

**FAIL 기준:** 빈 문자열 발견 시 실제 번역 추가 필요.

**참고:** `{count}`, `{name}` 같은 ICU 메시지 변수가 포함된 값은 허용:

```json
{ "totalItems": "총 {count}개" }  // ✅ 변수 포함 — 허용
{ "title": "" }                    // ❌ 빈 문자열 — 위반
```

### Step 4: useTranslations 네임스페이스 참조 확인

컴포넌트에서 사용하는 번역 네임스페이스가 실제 메시지 파일과 일치하는지 확인합니다.

```bash
# 컴포넌트에서 사용 중인 네임스페이스 목록 (최상위 네임스페이스만)
grep -rn "useTranslations\|getTranslations" apps/frontend --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|// " \
  | grep -oP "(?<=useTranslations\(')[^'\.]+|(?<=getTranslations\(')[^'\.]+" \
  | sort | uniq
```

```bash
# 실제 메시지 파일 도메인 목록
ls apps/frontend/messages/en/*.json | xargs -I{} basename {} .json | sort
```

**PASS 기준:** 컴포넌트에서 참조하는 모든 최상위 네임스페이스가 `messages/en/`에 파일로 존재.

**FAIL 기준:** 존재하지 않는 네임스페이스 참조 시 해당 JSON 파일 생성 필요.

**참고:** `useTranslations('common.actions')`처럼 점(.)으로 구분된 중첩 네임스페이스는 `common.json` 내 `actions` 키를 참조 — 파일 존재 여부가 아닌 키 존재 여부 확인 필요.

### Step 5: ICU 메시지 변수 쌍 일치 확인

en/ko에서 `{variable}` 플레이스홀더가 동일하게 사용되는지 확인합니다.

```bash
# en 파일의 ICU 변수 추출 후 ko와 비교 (ICU 변수 사용 도메인 전체)
for domain in equipment dashboard audit checkouts calibration approvals settings teams auth common navigation errors; do
  echo "=== $domain ==="
  diff \
    <(jq -r 'to_entries[] | .value | if type == "string" then . else empty end' \
      "apps/frontend/messages/en/${domain}.json" 2>/dev/null \
      | grep -oP '\{[^}]+\}' | sort | uniq) \
    <(jq -r 'to_entries[] | .value | if type == "string" then . else empty end' \
      "apps/frontend/messages/ko/${domain}.json" 2>/dev/null \
      | grep -oP '\{[^}]+\}' | sort | uniq) \
    && echo "OK" || echo "변수 집합 불일치 가능성"
done
```

**참고:** 이 검사는 전체 파일 수준의 변수 집합을 비교합니다. 개별 키 수준의 변수 불일치는 Step 2 키 구조 검사와 함께 수동 확인 필요. 새로운 ICU 변수 사용 도메인이 추가되면 `for domain in ...` 목록에 포함시켜야 합니다.

**PASS 기준:** 차이 없음 (동일한 ICU 변수 집합).

## Output Format

```markdown
| #   | 검사                     | 상태      | 상세                     |
| --- | ------------------------ | --------- | ------------------------ |
| 1   | en/ko 파일 쌍 존재       | PASS/FAIL | 누락 파일 목록           |
| 2   | 도메인별 키 쌍 일치      | PASS/FAIL | 불일치 도메인 + 키 목록  |
| 3   | 빈 번역 값               | PASS/FAIL | 빈 값 위치 목록          |
| 4   | 네임스페이스 참조 일관성 | PASS/INFO | 미존재 네임스페이스 목록 |
| 5   | ICU 변수 쌍 일치         | PASS/INFO | 변수 불일치 도메인 목록  |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **`reservations.json`** — 예약 기능이 미구현이므로 일부 키가 플레이스홀더(`"reservations"` 등)로 남아있을 수 있음
2. **중첩 네임스페이스 `useTranslations('common.actions')`** — `common.json` 파일이 존재하면 파일 누락으로 간주하지 않음. `actions` 키의 존재 여부가 실제 검증 대상
3. **Step 4의 동적 네임스페이스** — `useTranslations(dynamicNs)` 같은 동적 참조는 탐지 불가, 수동 확인 필요
4. **ICU 복수형(plural) 문법** — `{count, plural, one {1개} other {#개}}` 형태는 언어마다 다를 수 있으므로 Step 5에서 변수 불일치로 표시되더라도 의미적으로 올바른 경우 면제
5. **Step 5의 INFO 등급** — ICU 변수 불일치는 자동 수정이 불가능한 경우가 있으므로 FAIL이 아닌 INFO로 보고 후 수동 확인 권장
