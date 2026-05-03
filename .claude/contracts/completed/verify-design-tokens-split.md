# Contract: verify-design-tokens-split

**Mode**: 2 (Full)
**Domain**: meta-skills (`.claude/skills/verify-design-tokens/` mega-skill split)
**Date**: 2026-05-03

## Purpose

Phase 2.1 — verify-design-tokens (2241 lines, 50+ steps) → orchestrator (~700 lines) + 4 references/<sub-domain>.md.

플랜 분류:
- `references/primitives.md` — 토큰 3-way 동기화, BRAND_CLASS_MATRIX, globals.css, hex 하드코딩, dark prefix in brand
- `references/aria-wcag.md` — Dialog ARIA, list 시맨틱, focus-visible, role=alert/status, ConnectionBanner role
- `references/component-tokens.md` — Layer 3 컴포넌트 토큰, charCount, REQUIRED_FIELD_TOKENS, satisfies 가드, 신규 토큰 커버리지
- `references/motion.md` — transition-all 금지, motion-safe, ANIMATION_PRESETS, DASHBOARD_MOTION, prefers-reduced-motion

## Files in Scope

| 종류 | 경로 |
|---|---|
| 신규 | `.claude/skills/verify-design-tokens/references/primitives.md` |
| 신규 | `.claude/skills/verify-design-tokens/references/aria-wcag.md` |
| 신규 | `.claude/skills/verify-design-tokens/references/component-tokens.md` |
| 신규 | `.claude/skills/verify-design-tokens/references/motion.md` |
| 수정 | `.claude/skills/verify-design-tokens/SKILL.md` (2241 → ~700 lines) |

## MUST Criteria

### M1. references/ 4파일 존재 + 비어있지 않음
- `test -f .claude/skills/verify-design-tokens/references/primitives.md` 존재
- `test -f .claude/skills/verify-design-tokens/references/aria-wcag.md` 존재
- `test -f .claude/skills/verify-design-tokens/references/component-tokens.md` 존재
- `test -f .claude/skills/verify-design-tokens/references/motion.md` 존재
- 각 파일 lines ≥ 50 (실질 내용 보장)

### M2. SKILL.md 라인 수 압축
- `wc -l .claude/skills/verify-design-tokens/SKILL.md` ≤ 800 lines
- 본문에 frontmatter + Purpose + When to Run + Related Files + Workflow (entry points + 1-line summaries + references 링크)

### M3. 키워드 보존 — 핵심 SSOT 키워드가 references 또는 SKILL.md에 1건 이상 출현
- `BRAND_CLASS_MATRIX` 키워드: 새 위치(primitives 또는 SKILL.md)에 ≥1건
- `transition-all` 키워드: 새 위치(motion 또는 SKILL.md)에 ≥1건
- `role="alert"\|role="status"` 키워드: 새 위치(aria-wcag 또는 SKILL.md)에 ≥1건
- `Layer 3` 또는 `LAYER 3` 또는 `component token`: 새 위치(component-tokens 또는 SKILL.md)에 ≥1건
- `prefers-reduced-motion` 또는 `motion-safe`: 새 위치(motion 또는 SKILL.md)에 ≥1건
- `focus-visible`: 새 위치(aria-wcag 또는 SKILL.md)에 ≥1건
- `staggerFadeIn`: 새 위치(motion 또는 SKILL.md)에 ≥1건
- `globals.css`: 새 위치(primitives 또는 SKILL.md)에 ≥1건

### M4. SKILL.md frontmatter + 구조 무결성
- frontmatter `name: verify-design-tokens` 유지
- `## Purpose`, `## When to Run`, `## Related Files`, `## Workflow` 섹션 모두 존재
- 4개 references 링크 모두 SKILL.md에서 참조됨 (`grep -c "references/primitives\|references/aria-wcag\|references/component-tokens\|references/motion" SKILL.md` ≥ 4)

### M5. SSOT 라우팅 일관성
- 각 references 파일이 verify-design-tokens 외부에서 직접 참조되지 않음 (다른 verify-* 스킬에서 references/<...>.md 임포트 0건)

## SHOULD Criteria (비차단)

### S1. references 파일 line 수 합리적
- 각 references 파일 lines ≤ 1500 (단일 파일 mega-bloat 방지)
- 총 라인 합계 (4 references + SKILL.md) ≈ 원본 2241 ± 20% (정보 손실 최소화)

### S2. Step 번호 일관성
- references 파일 내 `### Step N: <title>` 헤더 잘 보존되어 grep 가능

### S3. 다른 verify-* 영향 0
- 분리 작업이 verify-design-tokens 외 스킬에 영향 없음 (`git status --short` 시 verify-design-tokens 외 verify-* 변경 0)

## Verification Commands

```bash
cd /home/kmjkds/equipment_management_system

# M1
echo "=== M1 ==="
for f in primitives aria-wcag component-tokens motion; do
  test -f .claude/skills/verify-design-tokens/references/$f.md && echo "OK: $f.md ($(wc -l < .claude/skills/verify-design-tokens/references/$f.md) lines)" || echo "FAIL: $f.md missing"
done

# M2
echo "=== M2 ==="
echo "SKILL.md lines: $(wc -l < .claude/skills/verify-design-tokens/SKILL.md)"

# M3
echo "=== M3 ==="
for kw in "BRAND_CLASS_MATRIX" "transition-all" 'role="alert"' "Layer 3" "prefers-reduced-motion" "focus-visible" "staggerFadeIn" "globals.css"; do
  count=$(grep -rc "$kw" .claude/skills/verify-design-tokens/ | grep -v ":0$" | wc -l)
  echo "$kw: $count files"
done

# M4
echo "=== M4 ==="
head -7 .claude/skills/verify-design-tokens/SKILL.md
grep -c "^## " .claude/skills/verify-design-tokens/SKILL.md
echo "references links: $(grep -c "references/primitives\|references/aria-wcag\|references/component-tokens\|references/motion" .claude/skills/verify-design-tokens/SKILL.md)"

# M5
echo "=== M5 ==="
grep -rln "verify-design-tokens/references" .claude/skills/ | grep -v "verify-design-tokens/" || echo "OK: 0 external references"
```
