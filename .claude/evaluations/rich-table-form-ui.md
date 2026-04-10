# Evaluation: rich_table Frontend Form UI

## Date: 2026-04-10

## MUST Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | `pnpm tsc --noEmit` 0 errors | **PASS** | Clean output |
| 2 | `pnpm --filter frontend run build` success | **PASS** | Build completes without errors |
| 3 | rich_table type selectable in ResultSectionFormDialog | **PASS** | `INSPECTION_RESULT_SECTION_TYPE_VALUES` imported from `@equipment-management/schemas`, includes `rich_table`; iterated in `<Select>` (line 155) |
| 4 | rich_table form: header inputs + row add/delete + cell text/image toggle | **PASS** | Header inputs (line 263-277), row add (line 373-391), row delete via Trash2 (line 361-370), text/image toggle buttons (line 287-324) |
| 5 | richTableData correctly built in handleSubmit | **PASS** | Lines 127-132: `dto.richTableData = { headers: richHeaders.filter(...), rows: richRows.map(row => row.cells) }` |
| 6 | ResultSectionPreview renders rich_table image cells | **PASS** | Lines 77-112: image cells display `[Photo: {documentId slice}...]` using i18n key |

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 7 | i18n: no hardcoded Korean/English | **FAIL** | 4 hardcoded English strings found (see details) |
| 8 | Accessibility: form elements have appropriate Labels | **FAIL** | Missing aria-labels on action buttons + wrong i18n key reuse (see details) |

## Detailed Findings

### FAIL: i18n Hardcoded Strings (SHOULD)

File: `ResultSectionFormDialog.tsx`

1. **Line 186** — `placeholder="Freq (GHz)\tGain (dB)\tSpec\n1.0\t44.12\t45 ± 2.5"` — hardcoded English placeholder for data_table paste area (not behind `t()`)
2. **Line 212** — `placeholder="UUID"` — hardcoded for photo documentId input
3. **Line 273** — `placeholder={\`Col ${hi + 1}\`}` — hardcoded English "Col" in column header placeholder
4. **Line 356** — `placeholder="Document UUID"` — hardcoded English for rich_table image cell input

### FAIL: Accessibility / Label Issues (SHOULD)

1. **"Add Column" button (line 246-261)** — no `aria-label`. Button text reuses `t('form.sectionTitle')` which translates to "Title" / "제목" — semantically wrong for an "add column" action.
2. **"Add Row" button (line 373-391)** — no `aria-label`. Button text reuses `t('addSection')` which translates to "Add Section" / "섹션 추가" — semantically wrong for an "add row" action.
3. Toggle buttons (text/image) and delete button correctly have `aria-label` attributes — OK.

### Semantic i18n Key Misuse (informational)

The rich_table form reuses generic i18n keys for table-specific actions:
- "Add Column" button displays `t('form.sectionTitle')` = "Title" — should be a dedicated key like `form.addColumn`
- "Add Row" button displays `t('addSection')` = "Add Section" — should be a dedicated key like `form.addRow`
- Column header label uses `t('form.sectionTitle')` = "Title" — should be something like `form.columnHeaders`

## Verdict

**All 6 MUST criteria: PASS**
**2 of 2 SHOULD criteria: FAIL**

The implementation is functionally complete. The SHOULD failures are: (1) four hardcoded English placeholder strings that bypass i18n, and (2) missing/wrong labels on the "Add Column" and "Add Row" buttons, plus semantic misuse of existing i18n keys for unrelated actions.
