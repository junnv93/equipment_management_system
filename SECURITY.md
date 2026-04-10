# Security Policy

## 보안 취약점 보고

이 프로젝트에서 보안 취약점을 발견하셨다면, **공개 이슈로 등록하지 마시고** 아래 방법으로 비공개 보고해 주세요.

- Email: kmjkds93@gmail.com
- Subject: `[SECURITY] 장비 관리 시스템 - 취약점 보고`

48시간 내에 응답하겠습니다.

## 보안 아키텍처

상세 보안 구현은 [docs/security/](docs/security/) 디렉토리를 참조하세요.

| 문서                                                                         | 설명                     |
| ---------------------------------------------------------------------------- | ------------------------ |
| [ARCHITECTURE-DIAGRAM.md](docs/security/ARCHITECTURE-DIAGRAM.md)             | 보안 아키텍처 다이어그램 |
| [THREAT-MODEL.md](docs/security/THREAT-MODEL.md)                             | 위협 모델링              |
| [SECURITY-IMPLEMENTATION.md](docs/security/SECURITY-IMPLEMENTATION.md)       | 보안 구현 상세           |
| [RELEASE-SECURITY-CHECKLIST.md](docs/security/RELEASE-SECURITY-CHECKLIST.md) | 릴리즈 보안 체크리스트   |

## 주요 보안 조치

- **인증**: JWT + Azure AD (Passport)
- **인가**: RBAC (역할 기반 접근 제어) + Permission Guard
- **데이터**: Zod 스키마 기반 입력 검증, SQL Injection 방지 (Drizzle ORM)
- **세션**: HttpOnly 쿠키, CSRF 방지
- **인프라**: Docker 네트워크 격리, Nginx 리버스 프록시, 내부 서비스 포트 미노출
