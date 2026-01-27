#!/bin/bash
# Claude Code Notification 훅 - Incoming Webhook 형식
#
# Office 365 Connector MessageCard 형식 사용

# .env 파일에서 Teams 웹훅 URL 로드
if [ -f "$CLAUDE_PROJECT_DIR/.env" ]; then
    source "$CLAUDE_PROJECT_DIR/.env"
else
    echo "오류: .env 파일을 찾을 수 없습니다: $CLAUDE_PROJECT_DIR/.env" >&2
    exit 1
fi

# Teams 웹훅 URL 확인
if [ -z "$TEAMS_WEBHOOK_URL" ]; then
    echo "오류: TEAMS_WEBHOOK_URL이 설정되지 않았습니다." >&2
    exit 1
fi

# JSON 입력에서 메시지 추출 (있는 경우)
MESSAGE=$(echo "$INPUT" | jq -r '.message // empty' 2>/dev/null)
if [ -z "$MESSAGE" ]; then
    MESSAGE="권한 요청 알림"
fi

# 프로젝트명 추출
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 디버깅을 위한 변수 출력 (stderr로 출력)
echo "DEBUG: MESSAGE = '$MESSAGE'" >&2
echo "DEBUG: PROJECT_NAME = '$PROJECT_NAME'" >&2
echo "DEBUG: TIMESTAMP = '$TIMESTAMP'" >&2

# JSON payload 생성 (Office 365 Connector MessageCard 형식)
PAYLOAD=$(cat <<EOF
{
  "@type": "MessageCard",
  "@context": "https://schema.org/extensions",
  "summary": "Claude Code 알림",
  "themeColor": "0076D7",
  "sections": [{
    "activityTitle": "🔔 Claude Code 알림",
    "activitySubtitle": "$PROJECT_NAME",
    "facts": [
      {
        "name": "프로젝트:",
        "value": "$PROJECT_NAME"
      },
      {
        "name": "상태:",
        "value": "$MESSAGE"
      },
      {
        "name": "시간:",
        "value": "$TIMESTAMP"
      },
      {
        "name": "유형:",
        "value": "권한 요청"
      }
    ],
    "markdown": true
  }]
}
EOF
)

echo "DEBUG: PAYLOAD = '$PAYLOAD'" >&2

# Teams로 알림 전송 (Incoming Webhook)
RESPONSE=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$TEAMS_WEBHOOK_URL" 2>&1)

# 성공 여부 확인
if [ $? -eq 0 ]; then
    echo "Teams 알림이 성공적으로 전송되었습니다." >&2
else
    echo "Teams 알림 전송에 실패했습니다." >&2
    echo "응답: $RESPONSE" >&2
    exit 1
fi
