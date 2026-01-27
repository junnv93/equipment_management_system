# Power Automate로 Teams Webhook 생성하기

## ✅ 이 방법이 가장 확실합니다!

Teams Workflows 앱 권한 문제를 피하고 Power Automate 웹사이트에서 직접 워크플로우를 생성합니다.

---

## 🌐 1단계: Power Automate 접속

1. 웹브라우저에서 https://make.powerautomate.com 접속
2. Microsoft 계정으로 로그인
3. 좌측 메뉴에서 **"만들기"** 클릭

---

## 🔧 2단계: 자동화된 클라우드 흐름 만들기

1. **"자동화된 클라우드 흐름"** 카드 클릭
2. 팝업 창에서:
   - **흐름 이름**: `Claude Code Teams 알림` 입력
   - **흐름 트리거 선택** 검색창에: `HTTP` 입력
   - **"HTTP 요청을 받은 경우"** 선택 (Request 아이콘)
   - **"만들기"** 버튼 클릭

---

## 📝 3단계: HTTP 트리거 설정

### A. 샘플 페이로드로 스키마 생성

**"HTTP 요청을 받은 경우"** 트리거 카드에서:

1. **"샘플 페이로드를 사용하여 스키마 생성"** 링크 클릭 (아래쪽에 있음)

2. 팝업창에 다음 JSON을 **복사하여 붙여넣기**:

```json
{
  "type": "message",
  "attachments": [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "contentUrl": null,
      "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.4",
        "body": [
          {
            "type": "TextBlock",
            "text": "🔔 Claude Code 알림",
            "weight": "Bolder",
            "size": "Large"
          },
          {
            "type": "FactSet",
            "facts": [
              {
                "title": "프로젝트:",
                "value": "equipment_management_system"
              },
              {
                "title": "상태:",
                "value": "테스트 메시지"
              },
              {
                "title": "시간:",
                "value": "2026-01-26 13:00:00"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

3. **"완료"** 버튼 클릭

### B. 자동 생성된 스키마 확인

샘플 페이로드로부터 JSON 스키마가 자동 생성됩니다. 확인만 하고 넘어가면 됩니다.

---

## 📨 4단계: Teams 메시지 게시 액션 추가

### A. 새 단계 추가

1. 트리거 아래의 **"+ 새 단계"** 버튼 클릭

### B. Teams 액션 검색

1. 검색창에 **"Teams adaptive"** 입력
2. **"Microsoft Teams"** 커넥터 선택
3. **"채팅 또는 채널에 Adaptive Card 게시"** 액션 선택

### C. Teams 연결 (처음 사용하는 경우)

처음 사용하면 Microsoft Teams에 로그인하라는 메시지가 나타납니다:

- **"로그인"** 클릭
- Microsoft 계정으로 인증
- 권한 승인

### D. 액션 설정

**"채팅 또는 채널에 Adaptive Card 게시"** 액션에서:

1. **게시 대상**: 드롭다운에서 `채널` 선택

2. **Team**: 드롭다운에서 `GRP.AP.SUW MFCC` 선택

   - (목록이 길면 검색 가능)

3. **Channel**: 드롭다운에서 `equipment management system_notification` 선택

   - (또는 원하는 다른 채널)

4. **Adaptive Card**: 이 필드가 가장 중요합니다!
   - 필드를 **클릭**
   - 우측에 **"동적 콘텐츠"** 패널이 나타남
   - **"식"** 탭 클릭 (fx 아이콘)
   - 다음 식을 입력:
     ```
     triggerBody()?['attachments']?[0]?['content']
     ```
   - **"확인"** 클릭

**중요!** 식이 올바르게 입력되었는지 확인하세요. 이 식은 webhook으로 받은 Adaptive Card의 content 부분을 추출합니다.

---

## 💾 5단계: 저장 및 URL 복사

### A. 워크플로우 저장

1. 우측 상단의 **"저장"** 버튼 클릭
2. 저장이 완료될 때까지 기다리기

### B. HTTP URL 복사

1. 저장 후 첫 번째 단계 **"HTTP 요청을 받은 경우"** 클릭 (축소되어 있을 수 있음)
2. 카드가 확장되면서 **HTTP POST URL**이 표시됩니다
3. URL 오른쪽의 **📋 복사 아이콘** 클릭

**URL 형식 예시:**

```
https://prod-12.eastus.logic.azure.com:443/workflows/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xxxxxxxxxx
```

---

## 🔐 6단계: .env 파일에 URL 설정

1. 프로젝트의 `.env` 파일을 엽니다:

   ```bash
   nano /home/kmjkds/equipment_management_system/.env
   ```

2. `TEAMS_WEBHOOK_URL` 줄을 찾습니다

3. 복사한 URL로 **교체**합니다 (따옴표 안에):

   ```bash
   TEAMS_WEBHOOK_URL="복사한_URL을_여기에_붙여넣기"
   ```

4. 저장합니다 (Ctrl+X, Y, Enter)

---

## ✅ 7단계: 테스트

### A. 테스트 스크립트 실행

```bash
cd /home/kmjkds/equipment_management_system
./.claude/hooks/test-hooks.sh
```

### B. Teams에서 확인

**Microsoft Teams** → **GRP.AP.SUW MFCC** 팀 → **equipment management system_notification** 채널

Adaptive Card 형식의 메시지가 도착했는지 확인!

### C. Power Automate 실행 기록 확인

1. Power Automate (make.powerautomate.com) → **"내 흐름"**
2. **"Claude Code Teams 알림"** 워크플로우 클릭
3. **"28일 실행 기록"** 탭에서 실행 결과 확인
   - ✅ 녹색 체크: 성공
   - ❌ 빨간 X: 실패 (클릭하여 오류 확인)

---

## 🎨 워크플로우 최종 구조

```
┌─────────────────────────────────────────┐
│ HTTP 요청을 받은 경우                    │
│ (트리거)                                │
│                                         │
│ - Method: POST                          │
│ - 받은 데이터: Adaptive Card JSON       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 채팅 또는 채널에 Adaptive Card 게시      │
│ (액션)                                  │
│                                         │
│ - Team: GRP.AP.SUW MFCC                │
│ - Channel: equipment_management_        │
│            system_notification          │
│ - Adaptive Card:                        │
│   triggerBody()?['attachments']?[0]?    │
│   ['content']                           │
└─────────────────────────────────────────┘
              ↓
        Teams 채널에 메시지 표시
```

---

## 🔍 문제 해결

### "Adaptive Card 필드에 식을 입력할 수 없어요"

- 필드를 클릭한 후 우측 패널에서 **"식"** 탭을 선택했는지 확인
- "동적 콘텐츠" 탭이 아닌 **"식"** 탭에서 입력해야 함

### "Teams에 메시지가 표시되지 않아요"

1. Power Automate → **실행 기록** 확인
2. 실패한 실행 클릭하여 오류 메시지 확인
3. 일반적인 오류:
   - **"InvalidTemplate"**: Adaptive Card 식이 잘못됨
   - **"Unauthorized"**: Teams 채널 권한 없음
   - **"NotFound"**: 채널을 찾을 수 없음

### "채널 목록이 표시되지 않아요"

- **Team을 먼저 선택**해야 Channel 목록이 나타납니다
- 새로고침이 필요하면 Team을 다시 선택해보세요

### "식 입력 시 오류가 나요"

식을 **정확히** 이렇게 입력하세요:

```
triggerBody()?['attachments']?[0]?['content']
```

- 따옴표는 작은따옴표 `'` 사용
- 대괄호 `[]`와 물음표 `?` 정확히 입력
- 공백 없이 입력

---

## 💡 추가 팁

### 여러 채널에 동시 알림

같은 워크플로우에서 여러 채널에 메시지를 보내려면:

1. **"+ 새 단계"** 다시 클릭
2. 또 다른 **"채팅 또는 채널에 Adaptive Card 게시"** 추가
3. 다른 채널 선택

### 알림 필터링

특정 조건일 때만 알림을 보내려면:

1. Teams 액션 위에 **"조건"** 추가
2. 예: `triggerBody()?['attachments']?[0]?['content']?['body']?[0]?['text']`가 특정 텍스트를 포함할 때만

### 워크플로우 끄기/켜기

Power Automate → **내 흐름** → 워크플로우 옆의 스위치 토글

---

## 📚 참고 자료

- [Power Automate HTTP 트리거](https://learn.microsoft.com/ko-kr/power-automate/triggers-introduction)
- [Teams 커넥터](https://learn.microsoft.com/ko-kr/connectors/teams/)
- [Adaptive Cards 디자이너](https://adaptivecards.io/designer/)

---

## ✨ 완료!

이제 Claude Code hook 스크립트가 Teams로 예쁜 Adaptive Card 알림을 보냅니다! 🎉
