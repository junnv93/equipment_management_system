# Wireframes

참조용 HTML 와이어프레임 — 구현과 1:1 대응이 아닌 시각적 레퍼런스입니다.
순수 CSS로 작성되어 있으며 Tailwind 클래스를 사용하지 않습니다.

---

## 반출입 (Checkouts) v2 재구성

> 설계 상세: `/home/kmjkds/.claude/plans/zany-swimming-feigenbaum.md`
> 생성 방법: `/review-design` Step 4 단독 호출

| 파일                               | 설명                                                                                                | 상태      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | --------- |
| `checkout-list-redesign-v2.html`   | 목록 페이지 — Hero KPI 비대칭 그리드 + 서브탭 IA + 그룹 카드 YourTurnBadge + 빈 상태 3종            | 생성 예정 |
| `checkout-detail-redesign-v2.html` | 상세 페이지 — 2-섹션 레이아웃 + WorkflowTimeline + NextStepPanel + Sticky ActionBar + Mobile Drawer | 생성 예정 |

### 와이어프레임 생성 방법

별도 세션에서 `/review-design` Step 4를 단독 호출하여 생성합니다:

```
/review-design Step 4 — 반출입 v2 와이어프레임 생성
- docs/wireframes/checkout-list-redesign-v2.html
- docs/wireframes/checkout-detail-redesign-v2.html
plan: /home/kmjkds/.claude/plans/zany-swimming-feigenbaum.md 참조
```

### 설계 원칙 (Section 0)

| 원칙                         | Nielsen                 | 설명                                                   |
| ---------------------------- | ----------------------- | ------------------------------------------------------ |
| P1 — Glanceable Status       | #1 Status Visibility    | 첫 진입 3초 내 "내 반출 상황 / 할 일" 파악             |
| P2 — Obvious Next Action     | #2 Real World Match     | 현재 상태 다음 액션을 fold 이내 표시                   |
| P3 — Progressive Disclosure  | #8 Aesthetic/Minimalist | 핵심 → 세부 → 이력 순서                                |
| P4 — Recognition over Recall | #6 Recognition          | 상태 뱃지 + 아이콘 + 색상 + tooltip으로 기억 부담 최소 |

---

## 버전 관리

기존 파일을 덮어쓰지 않고 `-v{N}` 접미사로 새 버전 생성합니다.

```
checkout-list-redesign.html      ← 기존 (없으면 신규)
checkout-list-redesign-v2.html   ← v2 재구성
```
