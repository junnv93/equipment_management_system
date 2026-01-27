# Microsoft Teams 알림 설정 가이드

## 📋 구현 완료 사항

✅ **Hook 스크립트 수정 완료**

- `notification-hook.sh`: Power Automate JSON 형식으로 변경
- `stop-hook.sh`: Power Automate JSON 형식으로 변경
- `.env`: SLACK_WEBHOOK_URL → TEAMS_WEBHOOK_URL로 변경

## 🔧 Power Automate Workflow 설정

현재 webhook URL이 이미 설정되어 있으므로, Power Automate에서 workflow를 수정하여 Teams 메시지를 보내도록 설정해야 합니다.

### 1단계: Power Automate 접속

1. https://make.powerautomate.com 접속
2. 좌측 메뉴에서 **"내 흐름"** 클릭
3. 현재 사용 중인 workflow 찾기 (URL의 workflow ID로 검색: `fbfb96c6013f43619c407b348d733ed6`)

### 2단계: HTTP 트리거 JSON Schema 설정

1. Workflow를 편집 모드로 열기
2. **"HTTP 요청을 받을 때"** 트리거 선택
3. **"요청 본문 JSON 스키마"** 섹션에 다음 스키마 입력:

```json
{
  "type": "object",
  "properties": {
    "project": {
      "type": "string",
      "description": "프로젝트 이름"
    },
    "status": {
      "type": "string",
      "description": "상태 메시지"
    },
    "timestamp": {
      "type": "string",
      "description": "발생 시간"
    },
    "event_type": {
      "type": "string",
      "description": "이벤트 유형 (권한 요청 알림 / 작업 완료 알림)"
    },
    "icon": {
      "type": "string",
      "description": "아이콘 (🔔 또는 ✅)"
    }
  },
  "required": ["project", "status", "timestamp", "event_type", "icon"]
}
```

### 3단계: Teams 메시지 게시 액션 추가

#### 옵션 A: 기본 텍스트 메시지 (권장 - 간단함)

1. **"+ 새 단계"** 클릭
2. **"Microsoft Teams"** 검색하여 선택
3. **"채팅 또는 채널에 메시지 게시"** 액션 선택
4. 다음과 같이 설정:
   - **게시 대상**: `채널`
   - **Team**: [알림을 받을 팀 선택]
   - **Channel**: [알림을 받을 채널 선택]
   - **메시지**: 다음 형식 사용

```
@{triggerBody()?['icon']} @{triggerBody()?['event_type']}

프로젝트: @{triggerBody()?['project']}
상태: @{triggerBody()?['status']}
시간: @{triggerBody()?['timestamp']}

Claude Code에서 알림이 도착했습니다.
```

#### 옵션 B: Adaptive Card 메시지 (고급 - 풍부한 UI)

1. **"+ 새 단계"** 클릭
2. **"Microsoft Teams"** 검색하여 선택
3. **"채팅 또는 채널에 적응형 카드 게시"** 액션 선택
4. 다음과 같이 설정:
   - **게시 대상**: `채널`
   - **Team**: [알림을 받을 팀 선택]
   - **Channel**: [알림을 받을 채널 선택]
   - **적응형 카드**: 다음 JSON 사용

```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "@{triggerBody()?['icon']} @{triggerBody()?['event_type']}",
      "weight": "Bolder",
      "size": "Large",
      "wrap": true
    },
    {
      "type": "FactSet",
      "facts": [
        {
          "title": "프로젝트:",
          "value": "@{triggerBody()?['project']}"
        },
        {
          "title": "상태:",
          "value": "@{triggerBody()?['status']}"
        },
        {
          "title": "시간:",
          "value": "@{triggerBody()?['timestamp']}"
        }
      ]
    },
    {
      "type": "TextBlock",
      "text": "Claude Code에서 알림이 도착했습니다.",
      "wrap": true,
      "isSubtle": true,
      "spacing": "Medium"
    }
  ]
}
```

### 4단계: Workflow 저장 및 활성화

1. 우측 상단 **"저장"** 클릭
2. Workflow가 **"켜짐"** 상태인지 확인

## ✅ 테스트

### 수동 테스트

hook 스크립트를 직접 실행하여 Teams 알림이 정상적으로 작동하는지 확인:

```bash
# notification-hook.sh 테스트
cd /home/kmjkds/equipment_management_system
echo '{"message": "테스트 알림 메시지"}' | .claude/hooks/notification-hook.sh

# stop-hook.sh 테스트
echo '{"hook_event_name": "task_completed"}' | .claude/hooks/stop-hook.sh
```

### 예상 결과

Teams 채널에 다음과 같은 메시지가 표시되어야 합니다:

**권한 요청 알림 (notification-hook.sh)**:

```
🔔 권한 요청 알림

프로젝트: equipment_management_system
상태: 테스트 알림 메시지
시간: 2026-01-26 15:30:00

Claude Code에서 알림이 도착했습니다.
```

**작업 완료 알림 (stop-hook.sh)**:

```
✅ 작업 완료 알림

프로젝트: equipment_management_system
상태: task_completed
시간: 2026-01-26 15:35:00

Claude Code에서 알림이 도착했습니다.
```

## 🔍 문제 해결

### 알림이 전송되지 않는 경우

1. **Webhook URL 확인**

   ```bash
   grep TEAMS_WEBHOOK_URL .env
   ```

   - URL이 올바르게 설정되어 있는지 확인

2. **Power Automate 실행 기록 확인**

   - Power Automate에서 workflow의 "실행 기록" 확인
   - 오류 메시지가 있는지 확인

3. **수동 curl 테스트**

   ```bash
   source .env
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"project":"test","status":"test","timestamp":"2026-01-26","event_type":"테스트","icon":"🔔"}' \
     "$TEAMS_WEBHOOK_URL"
   ```

4. **디버그 로그 확인**
   - hook 스크립트는 stderr로 디버그 정보를 출력합니다
   - Claude Code 실행 시 터미널에서 확인 가능

### Teams 메시지가 형식이 깨지는 경우

- Power Automate에서 JSON Schema가 올바르게 설정되었는지 확인
- 동적 콘텐츠가 올바르게 매핑되었는지 확인 (`@{triggerBody()?['field']}` 형식)

## 📌 보안 주의사항

- `.env` 파일에 webhook URL이 포함되어 있으므로 **절대 git에 커밋하지 마세요**
- `.gitignore`에 `.env`가 포함되어 있는지 확인
- Webhook URL이 노출되면 누구나 알림을 보낼 수 있으므로 주의

## 🎯 다음 단계

1. Power Automate workflow 설정 완료
2. 수동 테스트 실행
3. Claude Code 사용 중 실제 알림 확인
4. 필요시 메시지 형식 커스터마이징

## 📚 참고 자료

- [Power Automate HTTP 트리거 문서](https://learn.microsoft.com/ko-kr/power-automate/triggers-introduction)
- [Microsoft Teams 커넥터](https://learn.microsoft.com/ko-kr/connectors/teams/)
- [Adaptive Cards 디자이너](https://adaptivecards.io/designer/)
- [Claude Code Hooks 문서](https://docs.anthropic.com/claude-code/hooks)
