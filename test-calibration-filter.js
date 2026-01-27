// 교정 필터 로직 검증 스크립트
const { getUtcStartOfDay, getUtcEndOfDay, addDaysUtc } = require('./apps/backend/src/common/utils/date-utils');

console.log('=== 교정 필터 로직 검증 ===\n');

// 오늘 날짜 (2026-01-26)
const today = getUtcStartOfDay();
console.log(`오늘 (UTC): ${today.toISOString()}`);

// 30일 후
const in30Days = getUtcEndOfDay(addDaysUtc(today, 30));
console.log(`30일 후 (UTC 23:59:59): ${in30Days.toISOString()}`);
console.log('');

// 테스트 장비들
const testEquipment = [
  { name: 'SUW-E0001', nextCalibrationDate: new Date('2026-10-24T00:00:00.000Z') },
  { name: 'SUW-E0009', nextCalibrationDate: new Date('2026-05-24T00:00:00.000Z') },
  { name: '정확히 30일 후', nextCalibrationDate: addDaysUtc(today, 30) },
  { name: '29일 후', nextCalibrationDate: addDaysUtc(today, 29) },
  { name: '31일 후', nextCalibrationDate: addDaysUtc(today, 31) },
];

console.log('=== 30일 이내 필터 테스트 ===');
testEquipment.forEach(eq => {
  const calDate = getUtcStartOfDay(eq.nextCalibrationDate);
  const daysLeft = Math.ceil((calDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 필터 로직: today <= nextCalibrationDate <= in30Days
  const isInFilter = calDate.getTime() >= today.getTime() && calDate.getTime() <= in30Days.getTime();

  console.log(`\n${eq.name}:`);
  console.log(`  교정일: ${eq.nextCalibrationDate.toISOString()}`);
  console.log(`  남은 일수: ${daysLeft}일`);
  console.log(`  필터 포함: ${isInFilter ? '✅ YES' : '❌ NO'}`);
});
