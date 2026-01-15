# pnpm 사용 가이드

## 개요

장비 관리 시스템 프로젝트는 pnpm 패키지 관리자와 모노레포 구조를 사용합니다. 이 문서는 개발자가 프로젝트에서 pnpm을 효과적으로 사용하기 위한 가이드를 제공합니다.

## 설치 요구사항

- Node.js 18 이상 (권장: 18.19.0)
- pnpm 10 이상 (권장: 10.7.0)

## pnpm 전역 설치

```bash
# 전역적으로 pnpm 설치
npm install -g pnpm

# 버전 확인
pnpm --version
```

## 주요 명령어

### 기본 명령어

```bash
# 모든 패키지의 의존성 설치
pnpm install

# 루트 명령어 실행
pnpm dev           # 개발 서버 실행
pnpm build         # 모든 패키지 빌드
pnpm lint          # 린팅 실행
pnpm lint:fix      # 린팅 문제 자동 수정
pnpm test          # 테스트 실행
pnpm format        # 코드 포맷팅
```

### 특정 패키지 명령어

```bash
# 특정 워크스페이스에서 명령 실행
pnpm --filter <패키지명> <명령>

# 단축 명령어
pnpm frontend <명령>  # 프론트엔드 앱에서 명령 실행
pnpm backend <명령>   # 백엔드 앱에서 명령 실행
pnpm schemas <명령>   # schemas 패키지에서 명령 실행
pnpm ui <명령>        # UI 패키지에서 명령 실행
pnpm api-client <명령> # API 클라이언트 패키지에서 명령 실행

# 예시
pnpm frontend dev     # 프론트엔드 개발 서버 실행
pnpm backend build    # 백엔드 빌드
```

### 의존성 관리

```bash
# 루트에 개발 의존성 추가
pnpm add -D -w <패키지명>

# 특정 워크스페이스에 의존성 추가
pnpm --filter <패키지명> add <의존성>

# 개발 의존성 추가
pnpm --filter <패키지명> add -D <의존성>

# 워크스페이스 패키지 간 의존성 추가
pnpm --filter <패키지명> add <워크스페이스패키지명>

# 예시
pnpm --filter frontend add @equipment-management/ui           # 프론트엔드에 UI 패키지 추가
pnpm --filter backend add -D @types/node                      # 백엔드에 개발 의존성 추가
pnpm --filter @equipment-management/api-client add axios      # API 클라이언트에 axios 추가
```

### 의존성 업데이트

```bash
# 모든 패키지의 의존성 확인 (대화형)
pnpm check-deps

# 모든 패키지의 의존성 업데이트
pnpm update-deps
```

## 모노레포 구조

```
/
├── apps/                    # 애플리케이션
│   ├── backend/             # NestJS 백엔드 앱
│   └── frontend/            # Next.js 프론트엔드 앱
├── packages/                # 공유 패키지
│   ├── schemas/             # 공유 스키마 및 타입
│   ├── ui/                  # 공유 UI 컴포넌트
│   └── api-client/          # API 클라이언트
```

## 워크스페이스 패키지 의존성 주의사항

1. **패키지 이름**: `package.json`의 이름 필드를 정확히 사용해야 합니다.
2. **버전 관리**: 워크스페이스 패키지 간 의존성 버전은 `workspace:*`를 사용하는 것이 좋습니다.
3. **공유 패키지 exports**: 공유 패키지는 명확한 export 구조를 가져야 합니다.

## pnpm 설정 (.npmrc)

프로젝트는 루트에 `.npmrc` 파일로 pnpm 설정을 관리합니다:

- **shamefully-hoist**: 모노레포에서 필요한 종속성 호이스팅
- **strict-peer-dependencies**: 종속성 충돌 방지
- **node-linker**: 최적화된 링킹 방식
- **prefer-workspace-packages**: 워크스페이스 패키지 우선 사용

## Turborepo 통합

pnpm은 Turborepo와 함께 사용하여 빌드 프로세스를 최적화합니다:

- **캐싱**: 이전 빌드 결과를 캐싱하여 빌드 시간 단축
- **병렬 실행**: 의존성 그래프에 따라 작업 병렬 실행
- **파이프라인**: `turbo.json`에 정의된 작업 흐름에 따라 실행

## 트러블슈팅

### 일반적인 문제

1. **pnpm 버전 불일치**
   - 명령어: `pnpm --version`으로 버전 확인
   - 해결: `npm install -g pnpm@10.7.0`으로 권장 버전 설치

2. **의존성 문제**
   - 명령어: `pnpm install --force`로 의존성 강제 재설치
   - 해결: 필요시 `node_modules`와 `.pnpm-store` 삭제 후 재설치

3. **캐시 문제**
   - 명령어: `pnpm store prune`으로 사용하지 않는 패키지 정리
   - 해결: `pnpm store clear --force`로 캐시 완전 삭제

4. **호이스팅 문제**
   - 문제: 일부 패키지가 `Cannot find module` 오류 발생
   - 해결: `.npmrc`에 필요한 패키지를 `public-hoist-pattern`에 추가 