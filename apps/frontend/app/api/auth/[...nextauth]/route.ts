import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';

// 임시 사용자 정보 - 실제 구현에서는 데이터베이스에서 조회해야 함
const users = [
  {
    id: '1',
    name: '관리자',
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: '사용자',
    email: 'user@example.com',
    password: 'password123',
    role: 'USER',
  },
];

// NextAuth 핸들러 생성
const handler = NextAuth({
  providers: [
    // Azure AD 로그인 (환경변수가 설정된 경우에만 활성화)
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID,
          }),
        ]
      : []),
    
    // 이메일/비밀번호 로그인
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

        // 임시 사용자 인증 로직 - 실제 구현에서는 데이터베이스 조회 및 비밀번호 해시 비교가 필요함
        const user = users.find(
          (user) =>
            user.email === credentials.email &&
            user.password === credentials.password
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 