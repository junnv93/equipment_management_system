# Microsoft Teams 알림 설정 - 간단 가이드

## ✅ Hook 스크립트 준비 완료!

Hook 스크립트가 이미 Teams Adaptive Card 형식으로 수정되었습니다.
이제 **Teams에서 웹훅만 만들면 끝**입니다!

---

## 🚀 Teams에서 웹훅 만들기 (5분 완료)

### 1단계: Workflows 앱 설치

1. **Microsoft Teams** 실행
2. 왼쪽 사이드바에서 **"앱"** 클릭 (또는 `Ctrl+Shift+A`)
3. 검색창에 **"Workflows"** 또는 **"워크플로"** 입력
4. **Workflows** 앱 클릭 → **추가** 클릭

### 2단계: 웹훅 워크플로 만들기

#### 방법 A: 템플릿 사용 (가장 쉬움) ⭐ 권장

1. Workflows 앱에서 **"만들기"** 탭 클릭
2. 검색창에 **"웹훅"** 입력
3. **"채널에 웹훅 경고 보내기"** 템플릿 선택

   - 또는 **"채팅에 웹훅 경고 보내기"** 선택 (개인 채팅용)

4. 설정:

   - **워크플로 이름**: "Claude Code 알림" 입력
   - **채널 선택**: 알림을 받을 Teams 채널 선택
   - **다음** 클릭

5. **만들기** 클릭

#### 방법 B: 직접 만들기

1. Workflows 앱에서 **"만들기"** 탭 클릭
2. **"빈 항목에서 만들기"** 선택
3. 트리거 선택: **"Teams 웹훅 요청을 받을 때"** 검색하여 선택
4. 액션 추가: **"+"** 버튼 클릭 → **"채팅 또는 채널에 Adaptive Card 게시"** 선택
5. 설정:
   - **Team**: 팀 선택
   - **Channel**: 채널 선택
   - **Adaptive Card**: 자동으로 webhook 데이터가 매핑됨
6. **저장** 클릭

### 3단계: 웹훅 URL 복사

워크플로 생성이 완료되면:

1. **팝업 창에 URL이 표시됩니다**
2. **"URL 복사"** 버튼 클릭하여 복사
3. URL 형식 예시:
   ```
   https://prod-XX.eastus.logic.azure.com:443/workflows/xxxxxxxx/triggers/manual/paths/invoke?...
   ```

**나중에 URL 찾는 방법:**

1. Workflows 앱 열기
2. 만든 워크플로 선택
3. **편집** 클릭
4. 첫 번째 단계 **"Teams 웹훅 요청을 받을 때"** 클릭
5. **HTTP POST URL** 복사

### 4단계: .env 파일에 URL 설정

복사한 URL을 프로젝트의 `.env` 파일에 설정:

1. 터미널에서 다음 명령어 실행:

```bash
cd /home/kmjkds/equipment_management_system
nano .env
```

2. `TEAMS_WEBHOOK_URL` 값을 복사한 URL로 **교체**:

```bash
TEAMS_WEBHOOK_URL=복사한_URL을_여기에_붙여넣기
```

3. 저장하고 종료 (`Ctrl+X` → `Y` → `Enter`)

---

## ✅ 테스트

### 수동 테스트

```bash
cd /home/kmjkds/equipment_management_system

# 권한 요청 알림 테스트
echo '{"message": "테스트 알림입니다"}' | .claude/hooks/notification-hook.sh

# 작업 완료 알림 테스트
echo '{"hook_event_name": "task_completed"}' | .claude/hooks/stop-hook.sh
```

### 예상 결과

Teams 채널에 다음과 같은 **Adaptive Card** 형식의 메시지가 표시됩니다:

**권한 요청 알림:**

```
┌─────────────────────────────────────┐
│ 🔔 Claude Code 알림                 │
│                                     │
│ 프로젝트: equipment_management_system│
│ 상태: 테스트 알림입니다              │
│ 시간: 2026-01-26 12:00:00           │
│ 유형: 권한 요청 알림                 │
└─────────────────────────────────────┘
```

**작업 완료 알림:**

```
┌─────────────────────────────────────┐
│ ✅ Claude Code 작업 완료             │
│                                     │
│ 프로젝트: equipment_management_system│
│ 상태: task_completed                │
│ 시간: 2026-01-26 12:05:00           │
└─────────────────────────────────────┘
```

---

## 🎨 메시지 커스터마이징 (선택사항)

Adaptive Card 디자인을 변경하고 싶다면:

1. [Adaptive Cards Designer](https://adaptivecards.io/designer) 접속
2. 카드 디자인 편집
3. JSON 복사
4. Hook 스크립트의 `PAYLOAD` 부분 수정

---

## 🔍 문제 해결

### "Teams 알림 전송에 실패했습니다" 에러

1. **URL 확인**:

   ```bash
   grep TEAMS_WEBHOOK_URL .env
   ```

   - URL이 올바르게 설정되어 있는지 확인

2. **curl로 직접 테스트**:

   ```bash
   source .env
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{
       "type": "message",
       "attachments": [{
         "contentType": "application/vnd.microsoft.card.adaptive",
         "contentUrl": null,
         "content": {
           "type": "AdaptiveCard",
           "version": "1.4",
           "body": [{
             "type": "TextBlock",
             "text": "테스트 메시지"
           }]
         }
       }]
     }' \
     "$TEAMS_WEBHOOK_URL"
   ```

3. **Workflows 앱에서 실행 기록 확인**:
   - Workflows 앱 → 해당 워크플로 선택
   - **실행 기록** 확인
   - 실패한 경우 오류 메시지 확인

### 메시지가 표시되지 않는 경우

- Workflows가 올바른 채널로 설정되었는지 확인
- Workflows가 **"켜짐"** 상태인지 확인
- Teams 채널에 Workflows 봇이 추가되었는지 확인

---

## 📊 현재 구성

| 항목                 | 상태                   |
| -------------------- | ---------------------- |
| Hook 스크립트 형식   | ✅ Teams Adaptive Card |
| notification-hook.sh | ✅ 권한 요청 알림      |
| stop-hook.sh         | ✅ 작업 완료 알림      |
| .env 설정            | ⏳ URL 입력 필요       |
| Teams Workflows      | ⏳ 생성 필요           |

---

## 🎓 참고 자료

- [Microsoft Teams Workflows 공식 문서](https://support.microsoft.com/ko-kr/office/8ae491c7-0394-4861-ba59-055e33f75498)
- [Teams 웹훅 커넥터 개발자 문서](https://learn.microsoft.com/connectors/teams)
- [Adaptive Cards 디자이너](https://adaptivecards.io/designer/)
- [Adaptive Cards 샘플](https://adaptivecards.io/samples)

---

## 💡 주요 변경사항

### 이전 (Power Automate 커스텀 JSON)

```json
{
  "project": "...",
  "status": "...",
  "timestamp": "..."
}
```

❌ Teams가 직접 처리할 수 없는 형식

### 현재 (Teams Adaptive Card)

```json
{
  "type": "message",
  "attachments": [{
    "contentType": "application/vnd.microsoft.card.adaptive",
    "content": {
      "type": "AdaptiveCard",
      ...
    }
  }]
}
```

✅ Teams가 표준으로 지원하는 형식
