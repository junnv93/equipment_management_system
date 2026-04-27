/**
 * FSM Descriptor Table 재생성 스크립트
 *
 * 사용법:
 *   pnpm --filter @equipment-management/schemas run gen:descriptor-table
 *
 * getNextStep()의 전체 (status × purpose × role) 조합 결과를
 * descriptor-table.ts의 buildDescriptorTable() 동적 계산으로 갱신한다.
 *
 * ⚠️ 이 스크립트는 descriptor-table.ts를 직접 편집하지 않는다.
 * descriptor-table.ts 자체가 buildDescriptorTable()을 호출하는 self-generating 구조이므로
 * "재생성"은 FSM 변경 후 FSM 테스트(pnpm test)를 통해 검증하는 방식으로 이루어진다.
 *
 * S2 tech-debt: 향후 정적 스냅샷 파일로 전환 시 이 스크립트를 확장할 것.
 * 현재는 package.json scripts 등록 + FSM 변경 가이드 역할.
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');

console.log('📋 FSM Descriptor Table 검증 중...');
console.log('');
console.log('descriptor-table.ts는 buildDescriptorTable() 동적 계산 방식으로 구현됩니다.');
console.log('FSM 변경 후 아래 테스트로 드리프트를 감지하세요:');
console.log('');
console.log('  pnpm --filter @equipment-management/schemas test');
console.log('');

try {
  execSync('pnpm test', { cwd: packageRoot, stdio: 'inherit' });
  console.log('');
  console.log('✅ FSM table test PASS — descriptor-table.ts는 최신 상태입니다.');
  console.log('');
  console.log('S2 예정 작업: 정적 스냅샷 파일(descriptor-table.snapshot.ts) 생성으로 전환하여');
  console.log('FSM 변경 시 git diff에서 명시적으로 확인 가능하도록 개선 예정.');
} catch {
  console.error('');
  console.error('❌ FSM table test FAIL — FSM 변경으로 인한 드리프트가 감지되었습니다.');
  console.error('packages/schemas/src/fsm/checkout-fsm.ts 변경 후 테스트를 재실행하세요.');
  process.exit(1);
}
