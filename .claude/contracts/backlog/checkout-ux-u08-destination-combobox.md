---
slug: checkout-ux-u08-destination-combobox
type: contract
date: 2026-04-24
depends: [checkout-query-keys-view-resource-refactor]
sprint: 4
sprint_step: 4.5.U-08
---

# Contract: Sprint 4.5 · U-08 — Destination 자동완성 combobox + 최근 목적지 + fuzzy 검색

## Context

V2 §8 U-08: 반출 신청 시 destination 필드 입력이 매번 수동 → 오타/중복 발생. 자주 쓰는 목적지 + 퍼지 검색으로 개선.

- **기존 자산**: `queryKeys.checkouts.destinations` (Sprint 3.2 재편 후 `resource.destinations`) — 전체 목적지 리스트.
- **MRU 3개**: 서버가 user별 최근 사용 3건 제공 — `/checkouts/destinations/recent?userId`.
- **UI**: shadcn `Command` (command-k 패턴) + combobox role + keyboard navigation (↑↓ Enter).
- **팀/외부 그룹핑**: `CommandGroup`으로 구분.
- **빈 검색**: "+ 새 목적지 추가" 옵션.

---

## Scope

### 신규 생성
- `apps/frontend/components/checkouts/DestinationCombobox.tsx` — 반출 신청 폼 내부 destination 필드.
  - Props: `{ value; onChange; userId; teamId }`.
  - 내부: useQuery 2종 (recent + full) + fuzzy match (fuse.js 또는 간단한 자체 구현).
- `apps/backend/src/modules/checkouts/destinations.service.ts` (기존 있다면 확장) — `getRecentForUser(userId, limit=3)` method.
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` — `GET /checkouts/destinations/recent?userId`.
- `apps/frontend/lib/utils/fuzzy-search.ts` — 간단 fuzzy (또는 `fuse.js` dep 추가).

### 수정 대상
- 반출 신청 폼 (예: `apps/frontend/components/checkouts/CheckoutRequestForm.tsx` 또는 실제 경로) — destination input을 `<DestinationCombobox>`로 교체.
- `lib/api/query-config.ts` — `queryKeys.checkouts.resource.destinationsRecent({ userId })`.
- `packages/shared-constants/src/api-endpoints.ts` — `DESTINATIONS_RECENT`.
- **i18n**
  - `ko.json`/`en.json`:
    - `checkouts.destination.placeholder`
    - `checkouts.destination.groupRecent` ("최근 사용")
    - `checkouts.destination.groupTeam` ("팀 목적지")
    - `checkouts.destination.groupExternal` ("외부 목적지")
    - `checkouts.destination.addNew` ("+ 새 목적지 추가")
    - `checkouts.destination.noResults`
    - `checkouts.destination.aria.listbox`

### 수정 금지
- Destination 데이터 모델 / DB 스키마 (이미 존재).
- 전체 destinations API 기존 경로 (재활용).

---

## 참조 구현

```tsx
// DestinationCombobox.tsx (핵심)
import { Command, CommandGroup, CommandItem, CommandInput, CommandEmpty } from '@/components/ui/command';

export function DestinationCombobox({ value, onChange, userId }: Props) {
  const t = useTranslations('checkouts.destination');
  const [query, setQuery] = useState('');

  const { data: recent } = useQuery({
    queryKey: queryKeys.checkouts.resource.destinationsRecent({ userId }),
    queryFn: () => fetchRecentDestinations(userId),
    ...QUERY_PRESETS.LONG_STALE,
  });
  const { data: all } = useQuery({
    queryKey: queryKeys.checkouts.resource.destinations(),
    queryFn: fetchAllDestinations,
    ...QUERY_PRESETS.LONG_STALE,
  });

  const filtered = useMemo(() => fuzzyMatch(all ?? [], query), [all, query]);

  return (
    <Command role="combobox" aria-label={t('aria.listbox')}>
      <CommandInput value={query} onValueChange={setQuery} placeholder={t('placeholder')} />
      <CommandEmpty>
        {t('noResults')}
        <button type="button" onClick={() => onChange({ kind: 'new', label: query })}>
          {t('addNew')}
        </button>
      </CommandEmpty>
      {!query && recent && recent.length > 0 && (
        <CommandGroup heading={t('groupRecent')}>
          {recent.map(d => <CommandItem key={d.id} onSelect={() => onChange(d)}>{d.label}</CommandItem>)}
        </CommandGroup>
      )}
      <CommandGroup heading={t('groupTeam')}>
        {filtered.filter(d => d.kind === 'team').map(d => <CommandItem key={d.id} onSelect={() => onChange(d)}>{d.label}</CommandItem>)}
      </CommandGroup>
      <CommandGroup heading={t('groupExternal')}>
        {filtered.filter(d => d.kind === 'external').map(d => <CommandItem key={d.id} onSelect={() => onChange(d)}>{d.label}</CommandItem>)}
      </CommandGroup>
    </Command>
  );
}
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `DestinationCombobox.tsx` 신규 파일 + named export | grep |
| M3 | `GET /checkouts/destinations/recent` 엔드포인트 + `PermissionsGuard` | grep |
| M4 | `userId`는 서버 JWT에서 추출 (body/query 신뢰 금지, CLAUDE.md Rule 2) | grep |
| M5 | `queryKeys.checkouts.resource.destinationsRecent({ userId })` — stable key | grep |
| M6 | Recent 목록 최대 3건 상한 (서버 level) | test |
| M7 | shadcn `Command`의 combobox role + 키보드 navigation (↑↓ Enter Esc) | a11y E2E |
| M8 | 그룹핑: `CommandGroup` 3종(recent / team / external) | grep |
| M9 | 빈 검색 결과 시 "+ 새 목적지 추가" 옵션 렌더 + 클릭 시 onChange callback에 `{ kind: 'new', label: query }` 전달 | E2E |
| M10 | Fuzzy match: 한글/영어 부분일치 + accent-insensitive (`NFD` normalization) | unit test |
| M11 | i18n 7+ 키 양 로케일 | `jq` |
| M12 | a11y: combobox `aria-expanded`/`aria-controls`/`aria-activedescendant` consistency | axe |
| M13 | IME 가드: 한국어 조합 중 Enter 키로 잘못된 선택 방지 (`e.isComposing`) | E2E |
| M14 | E2E: 반출 신청 폼 → destination 클릭 → recent 3건 표시 → "A" 타이핑 → fuzzy 결과 → 클릭 → value 설정 | Playwright |
| M15 | `api-endpoints.ts`에 `DESTINATIONS_RECENT` 상수 등록 (하드코딩 URL 0) | grep |
| M16 | 변경 파일 수 ≤ **10** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `fuse.js` vs 자체 fuzzy — bundle-size 영향 평가 후 선택 | `fuzzy-search-lib-decision` |
| S2 | 새 목적지 추가 시 inline 등록 폼 (장소명 + 연락처 + 주소) | `destination-inline-create` |
| S3 | 팀별 공유 favorites (admin만 추가) | `destination-team-favorites` |
| S4 | 외부 목적지는 고객/거래처 데이터베이스 연동 | `destination-external-crm` |
| S5 | GIS 자동완성 (우편번호/좌표) — 향후 | `destination-gis-autocomplete` |
| S6 | Recent 목적지를 frequency-weighted sort (MRU + 빈도) | `destination-frequency-sort` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint apps/frontend/components/checkouts/DestinationCombobox.tsx
pnpm --filter backend run lint

test -f apps/frontend/components/checkouts/DestinationCombobox.tsx && echo "combobox OK"

grep -rn "destinations/recent\|destinationsRecent" apps/backend/src/modules/checkouts/ apps/frontend/

grep -n "req.user.userId" apps/backend/src/modules/checkouts/checkouts.controller.ts | grep -i destination

jq '.checkouts.destination' apps/frontend/messages/ko.json apps/frontend/messages/en.json

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 10

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u08-destination
```

---

## Acceptance

MUST 16개 PASS + E2E 자동완성 흐름 + fuzzy/IME 가드 검증 + a11y 0 violation.
SHOULD 미달 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 3.2 · `checkout-query-keys-view-resource-refactor.md` — `resource.destinations`/`destinationsRecent` 키 등록 지점. 선행.
- Sprint 4.5 U-02 · Keyboard — combobox 내부 IME 가드 공유.
- MEMORY.md Rule 2 (CLAUDE.md) — `userId` 서버 추출.
