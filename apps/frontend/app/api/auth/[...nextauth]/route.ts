import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';

// 백엔드 API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 환경 변수 확인
const isDevelopment = process.env.NODE_ENV === 'development';
const enableLocalAuth = process.env.ENABLE_LOCAL_AUTH === 'true' || isDevelopment;
const hasAzureAD = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET);

// NextAuth 핸들러 생성
const handler = NextAuth({
  providers: [
    // Azure AD 로그인 (환경변수가 설정된 경우 우선 활성화)
    ...(hasAzureAD
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            authorization: {
              params: {
                scope: 'openid profile email offline_access User.Read',
              },
            },
          }),
        ]
      : []),
    
    // 이메일/비밀번호 로그인 - 개발 환경에서만 활성화
    ...(enableLocalAuth
      ? [
          CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 백엔드 인증 API 호출
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          
          // 백엔드에서 받은 사용자 정보 반환
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.roles?.[0] || 'USER', // 첫 번째 역할 사용
            roles: data.user.roles || ['USER'],
            department: data.user.department,
            accessToken: data.access_token, // JWT 토큰 저장
          };
        } catch (error) {
          console.error('인증 오류:', error);
          return null;
        }
      },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Azure AD 로그인 처리
      if (account?.provider === 'azure-ad') {
        // Azure AD에서 받은 정보를 백엔드로 전달하여 JWT 생성
        // 백엔드의 Azure AD 인증은 Bearer 토큰을 직접 받아야 하므로,
        // 여기서는 Azure AD에서 받은 정보를 그대로 사용
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          // Azure AD 프로필에서 역할 정보 추출
          token.roles = (profile as any)?.roles || ['USER'];
          token.role = token.roles[0] || 'USER';
          token.department = (profile as any)?.department;
          token.accessToken = account.access_token;
        }
      }
      
      // 로컬 로그인 처리 (이미 authorize에서 처리됨)
      if (account?.provider === 'credentials' && user) {
        token.id = user.id;
        token.role = user.role;
        token.roles = user.roles;
        token.department = user.department;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // 세션에 사용자 정보 추가
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
        session.user.department = token.department as string | undefined;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 