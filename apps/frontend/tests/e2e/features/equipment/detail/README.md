# Equipment Detail Tests

## Overview

Tests for the equipment detail page (`/equipment/[id]`), including information display, tab navigation, permissions, disposal workflow, responsive design, and accessibility.

## Test Groups

| Group   | Name                 | Description                               |
| ------- | -------------------- | ----------------------------------------- |
| group1  | Information          | Basic equipment info display              |
| group2  | Tab Navigation       | Tab switching, state persistence, loading |
| group3  | Permissions          | Role-based access control                 |
| group4  | Disposal Workflow    | Disposal request from detail page         |
| group4b | Disposal Independent | Disposal tests without dependencies       |
| group6  | Responsive           | Desktop, tablet, mobile layouts           |
| group7  | Accessibility        | ARIA, keyboard nav, screen reader         |

## Running

```bash
pnpm --filter frontend exec npx playwright test features/equipment/detail
```
