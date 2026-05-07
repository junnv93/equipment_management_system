/**
 * commitlint config — Conventional Commits + Equipment Management System scope SSOT.
 *
 * scope-enum 은 SCOPE_LIST 단일 출처에서 derive — 새 모듈/메타 추가 시 SCOPE_LIST 만
 * 갱신하면 자동 적용. legacy commit 영향 0 (commit-msg hook 은 신규 commit 만 검사).
 *
 * SSOT 정합 검증: `node --test scripts/__tests__/commitlint-config.spec.mjs`
 */

// 26 backend modules — apps/backend/src/modules/* 와 1:1 SSOT.
// 자동 동기화: scripts/__tests__/commitlint-config.spec.mjs 가 filesystem 과 1:1 매칭 검증
// → 새 모듈 디렉토리 추가 시 본 배열 갱신 강제 (spec FAIL 로 회귀 차단).
const BACKEND_MODULE_SCOPES = [
  'approvals',
  'audit',
  'auth',
  'cables',
  'calibration',
  'calibration-factors',
  'calibration-plans',
  'checkouts',
  'dashboard',
  'data-migration',
  'documents',
  'equipment',
  'equipment-imports',
  'inspection-form-templates',
  'intermediate-inspections',
  'monitoring',
  'non-conformances',
  'notifications',
  'reports',
  'security',
  'self-inspections',
  'settings',
  'software-validations',
  'teams',
  'test-software',
  'users',
];

// 메타 영역 scope — 코드베이스 cross-cutting (도메인 무관).
// `security` 는 backend module 로 존재 → BACKEND_MODULE_SCOPES 측에서만 관리.
// 신규 추가 비용 = 1 줄. 결빙 X (운영 중 발견 시 추가 허용).
const META_SCOPES = [
  'ci', // GitHub Actions / pre-push / pre-commit
  'commit-pipeline', // commit pipeline safety / lintstaged / commitlint 자체
  'db', // Drizzle schema / migration
  'deps', // dependency bump / pnpm overrides
  'design', // design token / brand color / UI component
  'docs', // 문서 (CLAUDE.md / docs/* / ADR)
  'e2e', // playwright / e2e fixture
  'harness', // /harness orchestrator / Mode 1·2 sprint
  'hooks', // husky hook / .husky/*
  'i18n', // messages JSON / locale parity
  'infra', // docker compose / nginx / sops / age
  'layout', // app shell / sidebar / header
  'lint', // ESLint config / 룰 / SSOT
  'release', // 버전 bump / changelog
  'scripts', // scripts/* (codemod / verify-* / diagnostics)
  'secrets', // sops / age / .env.example
  'skill', // .claude/skills/* / verify-* SKILL.md
  'test', // 테스트 인프라 (jest config / vitest)
  'ui', // 공통 UI primitive (shadcn / Radix)
];

const SCOPE_LIST = Object.freeze([...BACKEND_MODULE_SCOPES, ...META_SCOPES].sort());

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능
        'fix', // 버그 수정
        'docs', // 문서 수정
        'style', // 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
        'refactor', // 코드 리팩토링
        'perf', // 성능 개선
        'test', // 테스트 추가/수정
        'chore', // 빌드 업무 수정, 패키지 매니저 설정 등
        'ci', // CI 설정 파일 및 스크립트 변경
        'build', // 빌드 시스템 또는 외부 종속성 변경
        'revert', // 이전 커밋 되돌리기
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    // scope-enum: SSOT 화이트리스트 — 신규 scope 는 SCOPE_LIST 에 추가.
    // SCOPE_LIST 외 commit 은 차단 (Equipment Management System 내부 일관성).
    'scope-enum': [2, 'always', SCOPE_LIST],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    // subject-case: subject 첫 글자가 대문자로 시작하면 reject (PascalCase identifier 중간 등장은 허용).
    // conventional config 가 이미 ['sentence-case','start-case','pascal-case','upper-case'] 를
    // never 로 정의하지만 명시적으로 한 번 더 보장 (extends 만으로는 IDE/lint tooling 인지 실패 가능).
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    // header-case: 명시적 비활성 (severity 0). `lower-case` 강제는 PascalCase identifier
    // (예: `UserRole`, `CheckoutDto`) 들어간 합법 commit 도 reject 하므로 도입하지 않음.
    // type-case(이미 lower-case 강제) + 위 subject-case 로 case 위생은 충분히 보장됨.
    // 본 entry 는 의도된 비활성을 SSOT 로 명시 — 차후 누군가 `header-case` 도입을 검토할 때
    // commit history grep 으로 의사결정 맥락이 즉시 발견되도록 함.
    'header-case': [0, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    // body-max-line-length: 본문 한 줄 100자 제한 — terminal/diff 가독성 보호.
    'body-max-line-length': [2, 'always', 100],
    // body-leading-blank: 본문 앞 공백 줄 — warn 으로 도입 (legacy commit 호환).
    'body-leading-blank': [1, 'always'],
    // footer-leading-blank: footer 앞 공백 줄 — warn 으로 도입 (Co-Authored-By 등).
    'footer-leading-blank': [1, 'always'],
  },
};

// 외부 도구 (verify-* SKILL / 자동화 / 문서 generation) 가 SCOPE_LIST 를 import 할 수 있도록 노출.
// commitlint 자체는 module.exports.rules 만 참조하므로 부수 효과 없음.
module.exports.SCOPE_LIST = SCOPE_LIST;
module.exports.BACKEND_MODULE_SCOPES = Object.freeze(BACKEND_MODULE_SCOPES);
module.exports.META_SCOPES = Object.freeze(META_SCOPES);
