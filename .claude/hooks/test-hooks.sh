#!/bin/bash
# Claude Code Hooks 테스트 스크립트

# 작업 디렉토리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

export CLAUDE_PROJECT_DIR="$PROJECT_DIR"

# .env 파일 로드
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
else
    echo "❌ 오류: .env 파일을 찾을 수 없습니다: $PROJECT_DIR/.env"
    exit 1
fi

echo "📍 프로젝트 디렉토리: $PROJECT_DIR"
echo "🔗 Webhook URL: ${TEAMS_WEBHOOK_URL:0:50}..."
echo ""

# 테스트 옵션
case "${1:-both}" in
    notification|n)
        echo "🔔 권한 요청 알림 테스트 중..."
        echo '{"message": "테스트 알림: Claude Code가 권한을 요청했습니다"}' | "$SCRIPT_DIR/notification-hook.sh" 2>&1
        ;;
    stop|s)
        echo "✅ 작업 완료 알림 테스트 중..."
        echo '{"hook_event_name": "test_task_completed"}' | "$SCRIPT_DIR/stop-hook.sh" 2>&1
        ;;
    both|b|*)
        echo "🔔 권한 요청 알림 테스트 중..."
        echo '{"message": "테스트 알림: Claude Code가 권한을 요청했습니다"}' | "$SCRIPT_DIR/notification-hook.sh" 2>&1
        echo ""
        echo "---"
        echo ""
        echo "✅ 작업 완료 알림 테스트 중..."
        echo '{"hook_event_name": "test_task_completed"}' | "$SCRIPT_DIR/stop-hook.sh" 2>&1
        ;;
esac

echo ""
echo "✨ 테스트 완료! Teams 채널에서 메시지를 확인하세요."
echo ""
echo "💡 사용법:"
echo "  ./test-hooks.sh           # 두 알림 모두 테스트"
echo "  ./test-hooks.sh notification  # 권한 요청 알림만 테스트"
echo "  ./test-hooks.sh stop          # 작업 완료 알림만 테스트"
