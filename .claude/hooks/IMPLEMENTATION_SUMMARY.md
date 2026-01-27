# Teams 알림 통합 구현 완료

## ✅ 완료된 작업

### 1. Hook 스크립트 변환 (Slack → Teams)

#### `/home/kmjkds/equipment_management_system/.claude/hooks/notification-hook.sh`

**주요 변경사항:**

- ❌ `SLACK_WEBHOOK_URL` → ✅ `TEAMS_WEBHOOK_URL`
- ❌ Slack 형식 (`--data-urlencode "payload=..."`) → ✅ JSON 형식 (`-H "Content-Type: application/json" -d "..."`)
- ❌ Slack payload 구조 → ✅ Power Automate JSON 구조:
  ```json
  {
    "project": "프로젝트명",
    "status": "메시지",
    "timestamp": "2026-01-26 10:50:00",
    "event_type": "권한 요청 알림",
    "icon": "🔔"
  }
  ```

#### `/home/kmjkds/equipment_management_system/.claude/hooks/stop-hook.sh`

**주요 변경사항:**

- ❌ `SLACK_WEBHOOK_URL` → ✅ `TEAMS_WEBHOOK_URL`
- ❌ Slack 형식 → ✅ JSON 형식
- ❌ Slack payload 구조 → ✅ Power Automate JSON 구조:
  ```json
  {
    "project": "프로젝트명",
    "status": "작업 상태",
    "timestamp": "2026-01-26 10:50:00",
    "event_type": "작업 완료 알림",
    "icon": "✅"
  }
  ```

### 2. 환경변수 업데이트

#### `/home/kmjkds/equipment_management_system/.env`

**변경사항:**

```diff
- # Slack 웹훅 URL for Claude Code 알림
- SLACK_WEBHOOK_URL=https://default701159540ccd45f087bd03b2a35875...
+ # Teams 웹훅 URL for Claude Code 알림 (Power Automate workflow)
+ TEAMS_WEBHOOK_URL=https://default701159540ccd45f087bd03b2a35875...
```

### 3. 실행 권한 설정

- ✅ `notification-hook.sh` - 실행 가능 (755)
- ✅ `stop-hook.sh` - 실행 가능 (755)

### 4. 문서 작성

- ✅ `TEAMS_SETUP_GUIDE.md` - Power Automate 설정 가이드
- ✅ `IMPLEMENTATION_SUMMARY.md` - 구현 요약 (이 파일)

## 📋 구현 전/후 비교

### 요청 형식 비교

**Before (Slack)**:

```bash
curl -X POST \
  --data-urlencode "payload={...}" \
  "$SLACK_WEBHOOK_URL"
```

**After (Power Automate/Teams)**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"project":"...","status":"...","timestamp":"...","event_type":"...","icon":"..."}' \
  "$TEAMS_WEBHOOK_URL"
```

### Payload 구조 비교

**Before (Slack)**:

```json
{
  "channel": "#claude-code",
  "username": "Claude Code",
  "text": "🔔 권한 요청 알림\n\n프로젝트: ...",
  "icon_emoji": ":bell:"
}
```

**After (Power Automate)**:

```json
{
  "project": "equipment_management_system",
  "status": "메시지 내용",
  "timestamp": "2026-01-26 10:50:00",
  "event_type": "권한 요청 알림",
  "icon": "🔔"
}
```

## 🎯 다음 단계

### 필수: Power Automate Workflow 설정

현재 hook 스크립트는 업데이트되었지만, **Power Automate workflow를 수정해야 Teams 메시지가 전송됩니다.**

👉 **상세 가이드**: `.claude/hooks/TEAMS_SETUP_GUIDE.md` 참조

**핵심 작업**:

1. Power Automate에서 workflow 편집
2. HTTP 트리거에 JSON Schema 추가
3. "Teams 메시지 게시" 액션 추가
4. 저장 및 활성화

### 선택: 테스트

Power Automate 설정 후 다음 명령어로 테스트:

```bash
# 권한 요청 알림 테스트
cd /home/kmjkds/equipment_management_system
echo '{"message": "테스트 알림"}' | .claude/hooks/notification-hook.sh

# 작업 완료 알림 테스트
echo '{"hook_event_name": "task_completed"}' | .claude/hooks/stop-hook.sh
```

## 🔧 기술적 개선사항

### 1. Content-Type 명시

- Slack: `application/x-www-form-urlencoded` (암묵적)
- Teams: `application/json` (명시적 헤더)

### 2. JSON 구조화

- **Slack**: 단일 `text` 필드에 모든 정보를 문자열로 결합
- **Teams**: 구조화된 JSON 필드로 분리 → Power Automate에서 동적 콘텐츠 활용 가능

### 3. 디버깅 개선

- 모든 변수를 stderr로 출력하여 디버깅 용이
- curl 응답을 `/dev/null`로 리다이렉트하여 출력 깔끔하게 유지

## 📊 파일 변경 요약

| 파일                        | 상태 | 변경 라인 수 | 주요 변경                  |
| --------------------------- | ---- | ------------ | -------------------------- |
| `notification-hook.sh`      | 수정 | ~20          | Slack → Teams 형식 전환    |
| `stop-hook.sh`              | 수정 | ~20          | Slack → Teams 형식 전환    |
| `.env`                      | 수정 | 2            | 환경변수명 변경            |
| `TEAMS_SETUP_GUIDE.md`      | 신규 | -            | Power Automate 설정 가이드 |
| `IMPLEMENTATION_SUMMARY.md` | 신규 | -            | 구현 요약 문서             |

## ✅ 체크리스트

- [x] Hook 스크립트 Slack → Teams 형식 변환
- [x] 환경변수 이름 변경 (SLACK → TEAMS)
- [x] 실행 권한 설정
- [x] 설정 가이드 작성
- [ ] **Power Automate workflow 설정** (사용자 작업 필요)
- [ ] **Teams 알림 테스트** (Power Automate 설정 후)

## 🎓 배운 점

1. **Webhook 프로토콜 차이**

   - Slack: Form-encoded payload
   - Power Automate: Raw JSON with Content-Type header

2. **구조화된 데이터의 장점**

   - Power Automate에서 각 필드를 개별적으로 접근 가능
   - Adaptive Cards 같은 리치 UI 구성 가능

3. **환경변수 관리**
   - 서비스 변경 시 환경변수 이름도 변경하여 명확성 확보
   - `.env` 파일을 반드시 git에서 제외
