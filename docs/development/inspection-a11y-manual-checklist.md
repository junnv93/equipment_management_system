# Inspection Accessibility Manual Checklist

## Scope

Manual accessibility checks for inspection flows that automated axe/Playwright checks cannot fully validate.

Primary workflows:

- WF-19 intermediate inspection form and result sections
- WF-20 self-inspection form and result sections
- Inspection template gallery and soft-fork dialogs

Primary assistive technology target:

- NVDA with Korean speech output on Windows
- Keyboard-only navigation in Chromium

## Preconditions

- Use a seeded test account with permission to create and review inspections.
- Run the app in the same environment used for Playwright E2E validation.
- Start from an equipment detail page that exposes the inspection tab.
- Browser zoom: 100%.
- OS display scaling: 100% or the lab-standard QA scaling.

## NVDA Korean Checklist

1. Open the equipment detail page and move to the inspection tab using `Tab` and `Enter`.
2. Confirm NVDA announces the active tab name and the selected state.
3. Open the self-inspection creation dialog.
4. Confirm the dialog is announced with a meaningful title and focus lands inside the dialog.
5. Move through date, cycle, result, remarks, and action controls with `Tab`.
6. Confirm every required field is announced with its label and required state.
7. Trigger validation with missing required fields.
8. Confirm the first error is reachable by keyboard and the error text is announced with the field context.
9. Fill a valid self-inspection and submit.
10. Confirm success feedback is announced and focus returns to a stable location in the inspection list.

Pass criteria:

- No unlabeled interactive control is announced as only "button", "edit", or "blank".
- Focus does not leave the dialog while it is open.
- Error text is programmatically associated with the failing field or announced immediately after validation.
- Korean labels are understandable without relying on visual position.

## ToggleGroup Keyboard Checklist

Use this sequence for result/status segmented controls and any ToggleGroup-like control in inspection forms.

1. Move focus to the ToggleGroup with `Tab`.
2. Confirm NVDA announces the group label before or with the focused option.
3. Use `ArrowRight` and `ArrowLeft` to move between options.
4. Use `Space` to select the focused option.
5. Use `Tab` to leave the group.
6. Use `Shift+Tab` to return and confirm the selected option remains stable.

Pass criteria:

- Arrow keys move focus without submitting the form.
- `Space` changes selection exactly once.
- Selected state is announced.
- Disabled options, if present, are announced as unavailable and cannot be selected.
- Leaving and returning to the group does not reset user selection.

## Template Gallery And Soft-Fork Dialog Checklist

1. Open an inspection form where no active template exists and gallery suggestions are available.
2. Confirm the gallery dialog title and item count are announced.
3. Navigate suggestion cards with keyboard only.
4. Select a suggested template and confirm focus returns to the inspection form.
5. Modify a prefilled cell and open the soft-fork decision dialog.
6. Confirm the dialog explains the decision without requiring visual-only cues.
7. Choose each available action with keyboard only in separate runs.

Pass criteria:

- Prefilled and user-modified states are not conveyed by color alone.
- Dialog close/cancel paths return focus to the control that opened the dialog or the next stable form control.
- Keyboard users can complete apply-once and apply-forward decisions.

## Mobile Width Manual Check

Viewport: `760 x 1024`.

1. Open the WF-20 self-inspection list.
2. Confirm each row stacks without horizontal scrolling.
3. Expand a row and inspect result sections.
4. Open the create/edit dialog.
5. Confirm fixed toolbars, action buttons, and validation text do not overlap content.

Pass criteria:

- No text is clipped at 760px width.
- No interactive control requires horizontal scrolling.
- Primary and secondary actions remain visible and reachable by keyboard.

## Evidence Template

Record manual runs in the PR or release checklist:

```md
### Inspection A11y Manual Run

- Date:
- Build/commit:
- Browser:
- NVDA version and voice:
- Locale:
- Workflow checked: WF-19 / WF-20 / Template Gallery / Soft Fork
- Result: PASS / FAIL
- Issues:
- Screenshots or screen recording:
```

## Failure Handling

Any failed item should create a follow-up issue with:

- exact route and equipment id used
- viewport size
- focused control name
- expected announcement
- actual announcement
- reproduction steps using keyboard-only input
