# Harness Docs — Format Conventions

## File Locations

| File | Path | Purpose |
|------|------|---------|
| Active prompts | `.claude/skills/harness/references/example-prompts.md` | Open/미완료 harness 프롬프트 백로그 |
| Archive Index | `.claude/skills/harness/references/archive-index.md` | 도메인별 아카이브 파일 네비게이션 (SSOT) |
| Archive (Migration) | `.claude/skills/harness/references/archive-migration.md` | 완료된 데이터 마이그레이션 섹션 보관 |
| Archive (Infra) | `.claude/skills/harness/references/archive-infra.md` | 완료된 E2E 인프라 / 테스트 / Legacy 섹션 보관 |
| Archive (Export) | `.claude/skills/harness/references/archive-export.md` | 완료된 양식 Export / DOCX 섹션 보관 |
| Archive (Domain) | `.claude/skills/harness/references/archive-domain.md` | 완료된 도메인 기능 섹션 보관 |
| Tech debt | `.claude/exec-plans/tech-debt-tracker.md` | SHOULD 실패·후속 이연 항목 |

## Section Header Format

```markdown
## YYYY-MM-DD 신규 — [작업명] (N건) [M건 완료, K건 미완료]
```

예시:
```markdown
## 2026-04-17 신규 — QR Phase 1-3 후속 개선 (10건) [8건 완료, 1건 미완료, 1건 사용자 결정 대기]
```

## Item Header Format

**오픈 아이템**:
```markdown
### 🔴 CRITICAL — [항목명] (Mode N)
### 🟠 HIGH — [항목명] (Mode N)
### 🟡 MEDIUM — [항목명] (Mode N)
### 🟢 LOW — [항목명] (Mode N)
```

**완료된 아이템** (strikethrough + 완료 날짜):
```markdown
### ~~🟠 HIGH — [항목명] (Mode N)~~ ✅ 완료 (YYYY-MM-DD)
```

## Completion Detection

섹션이 **아카이브 이동 대상**인 조건:
1. 섹션 내 모든 `###` 아이템이 `~~...~~ ✅` 형태로 strikethrough 처리됨
2. OR 섹션 헤더에 명시적 완료 표시 (`~~섹션명~~ ✅`)
3. 예외: `❓ 사용자 결정 대기` 항목이 있으면 → 사용자 확인 후 이동

**오픈 판단**: `### ~~` 없는 `### 🔴/🟠/🟡/🟢` 으로 시작하는 줄 = 미완료 아이템

## Archive File Structure

아카이브는 도메인별로 분리되어 있습니다. 각 파일 내 섹션 순서: **최신 차수가 위**

```markdown
# Harness 완료 프롬프트 아카이브 — [도메인명]

> 완료 처리된 프롬프트 섹션들. 최신 차수부터 역순 정렬.
> 전체 인덱스: [archive-index.md](./archive-index.md)

---

## [가장 최신 완료 섹션]

---

## [그 다음 최신 섹션]
```

섹션 구분선: `---` (빈 줄 포함, 섹션 사이 2줄)

## Archive Domain Classification

| 파일명 | 포함 도메인 |
|--------|------------|
| `archive-migration.md` | 데이터 마이그레이션 관련 (72차 등) |
| `archive-infra.md` | Docker, CI/CD, E2E 인프라, 이벤트/캐시 아키텍처, Legacy 섹션 |
| `archive-export.md` | DOCX export, 양식, 리포트 |
| `archive-design.md` | UI/UX 디자인 리뷰, 컴포넌트 리디자인, 접근성·모션 개선 |
| `archive-domain.md` | 장비, 체크아웃, 점검, SW validation 등 도메인 기능 |

새 아카이브 이동 시: 도메인 분류 후 해당 파일에 추가 + `archive-index.md` 섹션 인덱스 업데이트.
`example-prompts-archive.md`는 redirect stub으로만 유지 (직접 편집 금지).

## Tech Debt Tracker Format

```markdown
- [x] **[YYYY-MM-DD slug] 우선순위 — 항목명** — ✅ 완료 YYYY-MM-DD. 상세 설명.
- [ ] **[YYYY-MM-DD slug] 우선순위 — 항목명** — 미완료 설명.
```

오픈 항목 식별: `- [ ]` 로 시작하는 줄.
완료 항목 식별: `- [x]` 로 시작하는 줄.
