# 인증 시스템 설정 가이드

**작성일**: 2026-01-15  
**버전**: 1.0

---

## 🎯 인증 전략: 하이브리드 방식

### 환경별 설정

#### 개발 환경 (Development)
- ✅ **Azure AD** (선택사항 - 설정된 경우)
- ✅ **로컬 로그인** (항상 활성화)

#### 프로덕션 환경 (Production)
- ✅ **Azure AD** (필수)
- ❌ **로컬 로그인** (비활성화)

---

## 🔧 환경 변수 설정

### 개발 환경 (`.env.local`)

```env
# 필수
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# 로컬 로그인 활성화 (개발 환경)
ENABLE_LOCAL_AUTH=true

# Azure AD (선택사항)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
```

### 프로덕션 환경 (`.env.production`)

```env
# 필수
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# 로컬 로그인 비활성화
ENABLE_LOCAL_AUTH=false

# Azure AD (필수)
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
```

---

## 📋 사용 시나리오

### 시나리오 1: 개발 환경 (Azure AD 없음)
```
1. 로그인 페이지 접근
2. 이메일/비밀번호 폼만 표시
3. 로컬 계정으로 로그인
```

### 시나리오 2: 개발 환경 (Azure AD 설정됨)
```
1. 로그인 페이지 접근
2. "Microsoft 계정으로 로그인" 버튼 표시
3. "또는" 구분선
4. 이메일/비밀번호 폼 표시
5. 사용자가 선택하여 로그인
```

### 시나리오 3: 프로덕션 환경
```
1. 로그인 페이지 접근
2. "Microsoft 계정으로 로그인" 버튼만 표시
3. Azure AD로만 로그인 가능
```

---

## 🚀 빠른 시작

### 1. 개발 환경 설정 (로컬 로그인만)

```bash
# .env.local 파일 생성
cp .env.local.example .env.local

# NEXTAUTH_SECRET 생성 (터미널에서)
openssl rand -base64 32
# 또는 온라인 생성기 사용: https://generate-secret.vercel.app/32
```

### 2. Azure AD 설정 (선택사항)

1. Azure Portal에서 앱 등록
2. 클라이언트 ID, 시크릿, 테넌트 ID 복사
3. `.env.local`에 추가

### 3. 테스트 계정

로컬 로그인 테스트 계정:
- **관리자**: `admin@example.com` / `admin123`
- **매니저**: `manager@example.com` / `manager123`
- **일반 사용자**: `user@example.com` / `user123`

---

## 🔒 보안 고려사항

### 프로덕션 환경
- ✅ `ENABLE_LOCAL_AUTH=false` 필수
- ✅ Azure AD만 사용
- ✅ 강력한 `NEXTAUTH_SECRET` 사용
- ✅ HTTPS 필수

### 개발 환경
- ⚠️ 로컬 로그인은 개발 편의를 위한 것
- ⚠️ 프로덕션에 배포하지 않도록 주의
- ⚠️ 테스트 계정은 프로덕션에서 작동하지 않음

---

## 🐛 문제 해결

### Azure AD 로그인이 작동하지 않음
1. 환경 변수 확인 (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`)
2. Azure Portal에서 리디렉션 URI 확인
3. 브라우저 콘솔에서 에러 확인

### 로컬 로그인이 작동하지 않음
1. `ENABLE_LOCAL_AUTH=true` 확인
2. 백엔드 API가 실행 중인지 확인
3. `NEXT_PUBLIC_API_URL` 확인

---

## 📚 참고 자료

- [NextAuth.js Azure AD Provider](https://authjs.dev/getting-started/providers/azure-ad)
- [Azure AD 앱 등록 가이드](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
