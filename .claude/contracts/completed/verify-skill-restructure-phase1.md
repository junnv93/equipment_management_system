# Contract: verify-skill-restructure-phase1

**Mode**: 2 (Full)
**Domain**: meta-skills (`.claude/skills/verify-*` reorganization)
**Date**: 2026-05-03

## Purpose

verify-* 스킬 23 → 19로 통합. 4건 처리:
1. verify-cas → verify-zod + verify-frontend-state 흡수
2. verify-workflows → verify-e2e 흡수
3. verify-qr-ssot + verify-handover-security → verify-handover-qr 신규 통합
4. verify-implementation 테이블 / 참조 파일 동기화

전체 3-Phase 플랜에서 Phase 1만 다룸.

## Files in Scope

| 종류 | 경로 |
|---|---|
| 삭제 | `.claude/skills/verify-cas/` |
| 삭제 | `.claude/skills/verify-workflows/` |
| 삭제 | `.claude/skills/verify-qr-ssot/` |
| 삭제 | `.claude/skills/verify-handover-security/` |
| 신규 | `.claude/skills/verify-handover-qr/SKILL.md` |
| 신규 | `.claude/skills/verify-zod/references/cas-checks.md` (verify-cas에서 이동) |
| 신규 | `.claude/skills/verify-e2e/references/workflows-coverage.md` |
| 수정 | `.claude/skills/verify-zod/SKILL.md` |
| 수정 | `.claude/skills/verify-frontend-state/SKILL.md` |
| 수정 | `.claude/skills/verify-frontend-state/references/step-details.md` |
| 수정 | `.claude/skills/verify-e2e/SKILL.md` |
| 수정 | `.claude/skills/verify-implementation/SKILL.md` |
| 수정 | `.claude/skills/manage-skills/SKILL.md` |
| 수정 | `CLAUDE.md` |
| 수정 | `docs/references/skills-index.md` |

## MUST Criteria (모두 PASS여야 Phase 1 완료)

### M1. 스킬 디렉토리 정합성
- `.claude/skills/verify-cas/`, `verify-workflows/`, `verify-qr-ssot/`, `verify-handover-security/` 4개 디렉토리 **부재** (`ls` 시 모두 No such file)
- `.claude/skills/verify-handover-qr/SKILL.md` **존재** (frontmatter + Purpose + Steps)
- `verify-*` 디렉토리 총 **20개** (`ls .claude/skills/ | grep -c "^verify-"` = 20). 산술: 23 시작 - 4 삭제 + 1 신규 = 20. (플랜 본문의 "23 → 19" 표기는 가산 누락 — 정확한 산술은 +1을 포함한 20.)
- pre-existing orphan `verify-bulk-action-bar`는 iter 2에서 정식 등록 완료 (CLAUDE.md / skills-index.md / manage-skills 3곳 모두). verify-implementation 테이블 등록은 별도 tech-debt (click-feedback / routing-origin도 동일 누락 상태로 일괄 처리 예정).

### M2. CAS 키워드 흡수 검증 (verify-zod / verify-frontend-state 양쪽)
- `grep -l "VERSION_CONFLICT\|casVersion\|VersionedBaseService" .claude/skills/verify-zod/SKILL.md` → 매치
- `grep -l "VersionedBaseService\|onVersionConflict" .claude/skills/verify-zod/references/cas-checks.md` → 매치
- `grep -l "useCasGuardedMutation\|VERSION_CONFLICT" .claude/skills/verify-frontend-state/SKILL.md .claude/skills/verify-frontend-state/references/step-details.md` → 매치

### M3. Workflows 키워드 흡수 검증 (verify-e2e)
- `grep -l "WF-01\|WF-16\|WF-35\|workflows-coverage" .claude/skills/verify-e2e/SKILL.md .claude/skills/verify-e2e/references/workflows-coverage.md` → 매치
- 신규 `verify-e2e/references/workflows-coverage.md` 파일 존재

### M4. QR + Handover 통합 검증 (verify-handover-qr)
- `grep -c "QR_ACTION_VALUES\|QR_URL\|qr-config" .claude/skills/verify-handover-qr/SKILL.md` ≥ 1
- `grep -c "jti\|OneTimeToken\|handover" .claude/skills/verify-handover-qr/SKILL.md` ≥ 2
- 신규 SKILL.md에 두 sub-domain (QR SSOT / Handover Security) 소제목 분리 (`grep "^## " .claude/skills/verify-handover-qr/SKILL.md` 시 두 섹션 식별)

### M5. verify-implementation 테이블 19행
- `grep -c "^| [0-9]" .claude/skills/verify-implementation/SKILL.md` = 19
- 행 헤더 슬러그(첫 번째 컬럼 backtick slug)에 제거된 4개 슬러그 부재:
  - `grep -E "^\| [0-9]+\s*\| .verify-(cas|workflows|qr-ssot|handover-security)." .claude/skills/verify-implementation/SKILL.md` = 0건
- 행 헤더에 `verify-handover-qr` 1행 출현 (`grep -cE "^\| [0-9]+\s*\| .verify-handover-qr." SKILL.md` = 1)
- description/history 텍스트의 absorbed-slug 언급은 허용 (예: "2026-05-03 verify-cas 흡수" — 이력 표기)

### M6. 참조 파일 동기화 (행 헤더 / 리스트 항목 기준)
- `docs/references/skills-index.md`의 **bullet item header**(`- **verify-X**`)에 제거 4개 슬러그 부재:
  - `grep -cE "^- \*\*verify-(cas|workflows|qr-ssot|handover-security)\*\*" docs/references/skills-index.md` = 0건
- `docs/references/skills-index.md`에 `- **verify-handover-qr**` 1건 이상
- `CLAUDE.md`에 "Verify skills (19)" 표기
- `CLAUDE.md` Verify skills 인라인 목록에서 제거 4개 슬러그가 **목록 항목으로** 부재 (history 표기는 허용):
  - `grep "^- \*\*Verify skills (19)" CLAUDE.md` 매치 + 인라인 목록 부분에 ` -cas / `, ` -workflows / `, ` -qr-ssot / `, ` -handover-security / ` 패턴 0건
- `CLAUDE.md`에 `-handover-qr` 항목 1건 이상
- `.claude/skills/manage-skills/SKILL.md` 매트릭스 행 헤더(`| \`verify-X\``)에 제거 4개 슬러그 **0건**:
  - `grep -cE "^\| .verify-(cas|workflows|qr-ssot|handover-security)." .claude/skills/manage-skills/SKILL.md` = 0건
- `.claude/skills/manage-skills/SKILL.md`에 `| \`verify-handover-qr\`` 행 1건
- description/abserption history의 deleted-slug 언급은 모든 파일에서 허용 (예: "2026-05-03 verify-cas 흡수")

### M7. SKILL.md 무결성 (frontmatter + 본문)
- 모든 변경된 SKILL.md가 valid frontmatter (`---\nname: ...\ndescription: ...\n---`)로 시작
- verify-handover-qr SKILL.md frontmatter `name`은 `verify-handover-qr`
- verify-handover-qr description이 두 sub-domain을 모두 커버 (≥ 50자)

## SHOULD Criteria (실패해도 루프 차단 안 함, tech-debt 등록)

### S1. 라인 수 감축 검증
- 합계 ~1,700 lines 감축 (verify-cas 150 + workflows 203 + qr-ssot 246 + handover-security 152 = 751 삭제, 흡수 작업으로 추가 ~200 → 순 감축 ~550 — 플랜의 "1,700 감축" 표기는 sub-step 본문 기준이라 실제 차이 발생 가능). **감축치는 보고용**이며 차단 기준 아님.

### S2. references 위임 패턴 일관성
- verify-zod, verify-frontend-state, verify-e2e가 흡수된 step에 대해 **본문 + references 링크** 패턴 유지

### S3. CLAUDE.md 메모 SSOT
- `auto memory`의 verify-* 관련 항목 (verify-zod Step 16/18, verify-ssot Step 58, verify-e2e Step 23/24/25) 표기 — 삭제된 스킬 언급 없음

## Verification Commands

Evaluator가 실행할 검증 스크립트:

```bash
# M1: 디렉토리 정합성
echo "=== M1: 디렉토리 ==="
for d in verify-cas verify-workflows verify-qr-ssot verify-handover-security; do
  test ! -d ".claude/skills/$d" && echo "OK: $d removed" || echo "FAIL: $d still exists"
done
test -f .claude/skills/verify-handover-qr/SKILL.md && echo "OK: verify-handover-qr exists" || echo "FAIL: verify-handover-qr missing"
echo "verify-* count: $(ls .claude/skills/ | grep -c '^verify-')"
# 기대: 19

# M2: CAS 키워드
echo "=== M2: CAS 흡수 ==="
grep -l "VERSION_CONFLICT\|casVersion\|VersionedBaseService" .claude/skills/verify-zod/SKILL.md .claude/skills/verify-zod/references/cas-checks.md 2>/dev/null
grep -l "useCasGuardedMutation\|VERSION_CONFLICT" .claude/skills/verify-frontend-state/SKILL.md .claude/skills/verify-frontend-state/references/step-details.md 2>/dev/null

# M3: Workflows 흡수
echo "=== M3: Workflows 흡수 ==="
test -f .claude/skills/verify-e2e/references/workflows-coverage.md && echo "OK: workflows-coverage.md" || echo "FAIL"
grep -l "WF-01\|WF-16" .claude/skills/verify-e2e/SKILL.md .claude/skills/verify-e2e/references/*.md 2>/dev/null

# M4: QR + Handover 통합
echo "=== M4: QR + Handover ==="
grep -c "QR_ACTION_VALUES\|QR_URL\|qr-config" .claude/skills/verify-handover-qr/SKILL.md
grep -c "jti\|OneTimeToken\|handover" .claude/skills/verify-handover-qr/SKILL.md

# M5: verify-implementation 19행
echo "=== M5: verify-implementation ==="
echo "Rows: $(grep -c '^| [0-9]' .claude/skills/verify-implementation/SKILL.md)"
echo "Removed slugs: $(grep -c 'verify-cas\|verify-workflows\|verify-handover-security\|verify-qr-ssot' .claude/skills/verify-implementation/SKILL.md)"
echo "verify-handover-qr: $(grep -c 'verify-handover-qr' .claude/skills/verify-implementation/SKILL.md)"

# M6: 참조 파일
echo "=== M6: 참조 동기화 ==="
echo "skills-index removed: $(grep -c 'verify-cas\|verify-workflows\|verify-qr-ssot\|verify-handover-security' docs/references/skills-index.md)"
echo "skills-index added: $(grep -c 'verify-handover-qr' docs/references/skills-index.md)"
echo "CLAUDE.md count: $(grep -c 'Verify skills (' CLAUDE.md)"
echo "CLAUDE.md removed slugs: $(grep -c 'verify-cas\|verify-workflows\|verify-qr-ssot\|verify-handover-security' CLAUDE.md)"
```
