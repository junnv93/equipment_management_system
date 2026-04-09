# PostToolUse Hook 주의사항

**Prettier가 PostToolUse hook으로 Write|Edit 후 자동 실행됩니다.**

- `"file was modified by a linter"` system-reminder는 **대부분 포맷만 변경된 것**
- 이 메시지를 보고 즉시 재시도하지 말 것 — 먼저 `git diff`로 실제 상태를 확인
- Edit 실패가 의심되면: `git diff` → 변경 누락 확인 → 원인 파악(매칭 실패? Prettier 충돌?) → 대응

**대응 단계:**

1. Edit 후 `git diff`로 의도한 변경이 반영되었는지 확인
2. 반영됨 → 끝. system-reminder 무시
3. 미반영 → 원인 파악 후 Edit 재시도 (컨텍스트를 더 구체적으로)
4. Edit이 반복 실패 → `sed` 사용 가능 (최후 수단, 원인 파악 후에만)

**절대 금지:**

- `--no-verify`로 pre-commit hook 우회
- Write로 파일 전체 덮어쓰기 (다른 변경사항 소실 위험)
- "컨텍스트가 커졌다" → 별도 agent에서 재작업
