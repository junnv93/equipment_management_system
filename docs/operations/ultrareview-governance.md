# UltraReview 거버넌스 정책

> **목적**: `/ultrareview` 기능의 사용 정책, 비용 관리, 프로덕션 전환 시 의무화 조건.

---

## Solo 단계 (현재 — 1인 개발)

- `/ultrareview`는 **권고** — pre-push advisor가 정보성 메시지만 출력, push 차단 없음
- `node scripts/ultrareview-advisor.mjs` Go 판정 + `node scripts/ultrareview-preflight.mjs` 통과 시 선택적 실행
- 무료 3회(Pro/Max one-time) 우선 사용 → 소진 후 월 $30 상한 내 extra usage
- 소진 시 대안: `UR-3` 로컬 fleet 프롬프트 (`example-prompts.md`)

---

## 팀 확장 단계 (팀원 1명+ 추가 시)

전환 트리거: **프로덕션 런칭 또는 팀원 온보딩** 중 먼저 발생하는 시점.

### 활성화 절차

1. **Branch protection 복구**
   - `main` 브랜치: require PR + 1 review + status checks 활성화
   - 참조: `docs/security/THREAT-MODEL.md:72`, `docs/security/CAR-RESPONSE.md:304`

2. **GitHub Actions CI 활성화**
   - `.github/workflows/main.yml` — tsc + test + gitleaks action (이미 있음, 확인만)
   - PR 머지 조건: CI green + ultrareview Go 판정 시 `/ultrareview <PR번호>` 실행 요구

3. **Extra usage 정책 합의**
   - 팀 단위 Claude.ai Team 계정 전환 검토 (Team: free runs 없음, extra usage 직접 청구)
   - 월 $100 이하: reviewer 재량, 월 $100+: 팀 합의 후 실행

4. **ultrareview 필수화 조건 (Go 판정 PR에만 적용)**
   - `ultrareview-advisor.mjs --json | jq '.decision == "Go"'` = true
   - PR merge checklist에 "ultrareview 통과 또는 UR-3 대체 실행" 항목 추가

---

## Rollback 조건

6개월 주기 회고에서 다음 중 하나 충족 시 ultrareview 비활성화 검토:

- True-positive rate < 20% (false positive가 80% 이상)
- 평균 회당 비용 > $15 AND 이슈 발견 0건인 비율 > 60%
- 팀 합의로 비용 대비 가치 인정 불가

비활성화 방법:

1. `CLAUDE.md` "머지 전 고위험 변경 검토" 항목 제거
2. `.husky/pre-push` ultrareview-advisor 호출 라인 삭제
3. `example-prompts.md` UR-1/2/3 섹션 archive 이동

---

## 비용 추적

| 기간                | 실행 횟수 | 평균 비용 | true-positive 건수 | false-positive 건수 |
| ------------------- | --------- | --------- | ------------------ | ------------------- |
| (실제 사용 후 입력) | —         | —         | —                  | —                   |

→ `scripts/ultrareview-metrics.mjs` (Phase 3.3, 선택적) 구현 후 자동화 예정.

---

## 관련 문서

- [ultrareview-usage.md](../references/ultrareview-usage.md) — 트리거 알고리즘 + 실행 흐름
- [project_workflow_reactivate_branches_on_production.md](../../.claude/projects/-home-kmjkds-equipment-management-system/memory/project_workflow_reactivate_branches_on_production.md) — branch protection 재활성화 체크리스트
- [secret-backup.md](./secret-backup.md) — sops+age 키 관리 (ultrareview 업로드 전 필수 확인)
- [공식 문서](https://code.claude.com/docs/en/ultrareview)
