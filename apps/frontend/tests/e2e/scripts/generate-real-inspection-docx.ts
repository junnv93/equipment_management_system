/**
 * 실제 양식 데이터 기반 중간점검 DOCX 생성 스크립트
 *
 * docs/procedure/실제양식/에서 추출한 실제 점검 데이터로 중간점검을 생성하고
 * 3단계 승인 후 DOCX로 내보내어 실제 양식과 비교 가능하게 합니다.
 *
 * 사용법: npx tsx tests/e2e/scripts/generate-real-inspection-docx.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { BASE_URLS } from '../shared/constants/shared-test-data';

const BACKEND = BASE_URLS.BACKEND;
const CALIB_ID = 'bbbb0001-0001-0001-0001-000000000001';
const today = new Date().toISOString().split('T')[0];

async function getToken(role: string): Promise<string> {
  const resp = await fetch(`${BACKEND}/api/auth/test-login?role=${role}`);
  if (!resp.ok) throw new Error(`test-login failed: ${resp.status}`);
  const data = (await resp.json()) as Record<string, string>;
  return data.access_token ?? data.token ?? data.accessToken;
}

async function api(
  method: string,
  apiPath: string,
  token: string,
  body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const resp = await fetch(`${BACKEND}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API ${method} ${apiPath} failed (${resp.status}): ${err}`);
  }
  return (await resp.json()) as Record<string, unknown>;
}

async function getVersion(token: string, inspectionId: string): Promise<number> {
  const data = await api('GET', `/api/intermediate-inspections/${inspectionId}`, token);
  return (data.version as number) ?? 1;
}

async function uploadPng(
  token: string,
  filePath: string,
  fileName: string,
  inspectionId: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'image/png' }), fileName);
  formData.append('documentType', 'inspection_photo');
  formData.append('intermediateInspectionId', inspectionId);
  const resp = await fetch(`${BACKEND}/api/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  const data = (await resp.json()) as { document: { id: string } };
  return data.document.id;
}

async function approve3Step(
  inspectionId: string,
  teToken: string,
  tmToken: string,
  lmToken: string
) {
  let v = await getVersion(teToken, inspectionId);
  await api('PATCH', `/api/intermediate-inspections/${inspectionId}/submit`, teToken, {
    version: v,
  });
  v = await getVersion(tmToken, inspectionId);
  await api('PATCH', `/api/intermediate-inspections/${inspectionId}/review`, tmToken, {
    version: v,
  });
  v = await getVersion(lmToken, inspectionId);
  await api('PATCH', `/api/intermediate-inspections/${inspectionId}/approve`, lmToken, {
    version: v,
  });
}

async function exportDocx(token: string, inspectionId: string): Promise<Buffer> {
  await fetch(`${BACKEND}/api/auth/test-cache-clear`, { method: 'POST' }).catch(() => {});
  const resp = await fetch(
    `${BACKEND}/api/reports/export/form/UL-QP-18-03?inspectionId=${inspectionId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

// ============================================================================
// 실제 양식 데이터 정의
// ============================================================================

// 시드 장비 UUID (측정장비 리스트용)
const SEED_EQUIPMENT = {
  SIGNAL_GENERATOR: 'eeee1002-0002-4002-8002-000000000002', // SUW-E0002 신호 발생기
  POWER_AMP: 'eeee6002-0002-4002-8002-000000000002', // PYT-A0002 전력 증폭기
  SENSOR: 'eeee4006-0006-4006-8006-000000000006', // SUW-A0006 센서
};

interface InspectionSpec {
  name: string;
  classification: string;
  inspectionCycle: string;
  calibrationValidityPeriod: string;
  remarks: string;
  items: Array<{
    itemNumber: number;
    checkItem: string;
    checkCriteria: string;
    checkResult: string;
    judgment: 'pass' | 'fail';
  }>;
  measurementEquipment: Array<{ equipmentId: string; calibrationDate?: string }>;
  resultSections: Array<Record<string, unknown>>;
}

const SPECS: InspectionSpec[] = [
  // === 1. SUW-E0001: RECEIVER, EMI (ESU 40) — RF 입력 + OBW 특성 ===
  {
    name: 'SUW-E0001_Receiver_SG',
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    remarks: '',
    items: [
      {
        itemNumber: 1,
        checkItem: '외관 검사',
        checkCriteria: '마모 상태 확인',
        checkResult: '이상 없음',
        judgment: 'pass',
      },
      {
        itemNumber: 2,
        checkItem: '장비 내부 자체 점검 프로그램',
        checkCriteria: '장비 내부 점검',
        checkResult: '이상 없음',
        judgment: 'pass',
      },
      {
        itemNumber: 3,
        checkItem: 'RF 입력 검사',
        checkCriteria: 'S/G Level의 약 |±1| dB',
        checkResult: 'Min : 0.03 dB\nMax : 0.88 dB',
        judgment: 'pass',
      },
      {
        itemNumber: 4,
        checkItem: 'OBW 특성 검사',
        checkCriteria: '99% BW(MHz)',
        checkResult: '20 MHz : 17.95\n15 MHz : 13.46\n10 MHz : 8.97\n5 MHz : 4.62',
        judgment: 'pass',
      },
    ],
    measurementEquipment: [
      { equipmentId: SEED_EQUIPMENT.SIGNAL_GENERATOR, calibrationDate: '2025-12-30' },
      { equipmentId: SEED_EQUIPMENT.POWER_AMP, calibrationDate: '2025-07-21' },
    ],
    resultSections: [
      // 원본 구조: [대제목] → [소제목] → [데이터] → [소제목] → [데이터] → [비고]
      { sortOrder: 0, sectionType: 'title', title: '측정 결과' },
      {
        sortOrder: 1,
        sectionType: 'data_table',
        title: 'RF 입력 검사',
        tableData: {
          headers: ['Freq (MHz)', 'SG Level (dBm)', 'Reading (dBm)', 'Deviation (dB)'],
          rows: [
            ['10', '0', '0.16', '0.16'],
            ['100', '0', '0.15', '0.15'],
            ['300', '0', '0.14', '0.14'],
            ['500', '0', '0.11', '0.11'],
            ['1000', '0', '0.02', '0.02'],
            ['2000', '0', '-0.07', '0.07'],
            ['3000', '0', '0.09', '0.09'],
            ['4000', '0', '0.13', '0.13'],
            ['5000', '0', '-0.46', '0.46'],
            ['6000', '0', '-0.60', '0.60'],
            ['8000', '0', '-0.66', '0.66'],
            ['10000', '0', '-0.49', '0.49'],
            ['12000', '0', '-0.88', '0.88'],
            ['14000', '0', '-0.80', '0.80'],
            ['16000', '0', '-0.56', '0.56'],
            ['18000', '0', '-0.87', '0.87'],
            ['20000', '0', '-0.76', '0.76'],
            ['22000', '0', '-0.32', '0.32'],
            ['24000', '0', '-0.62', '0.62'],
            ['26000', '0', '0.08', '0.08'],
            ['28000', '0', '0.09', '0.09'],
            ['30000', '0', '-0.09', '0.09'],
            ['32000', '0', '-0.03', '0.03'],
            ['34000', '0', '-0.60', '0.60'],
            ['36000', '0', '-0.57', '0.57'],
            ['38000', '0', '-0.09', '0.09'],
            ['40000', '0', '0.72', '0.72'],
          ],
        },
      },
      {
        sortOrder: 2,
        sectionType: 'data_table',
        title: 'OBW 특성 검사',
        tableData: {
          headers: ['Freq (MHz)', 'BW', '99% BW Reading (MHz)', 'Data'],
          rows: [
            ['2400', '20 M', '17.95', ''],
            ['', '15 M', '13.46', ''],
            ['', '10 M', '8.97', ''],
            ['2400', '5 M', '4.62', ''],
          ],
        },
      },
      {
        sortOrder: 3,
        sectionType: 'text',
        title: '',
        content:
          '※ Cable Loss S/A에서 선 보상함\n' +
          '■ Connector 마모 상태 및 전원 공급기 동작 확인 완료\n' +
          '■ Self-Calibration 결과 이상 없음\n' +
          '■ Signal Generator로 0 dBm 출력하여 Spectrum Analyzer로 확인 결과 데이터 값이 |±1| dB 이내임을 확인함.\n' +
          '■ 5,10,15,20 MHz의 BW를 가진 변조 신호를 출력하여 Spectrum Analyzer로 확인 결과 이상 없음.',
      },
    ],
  },

  // === 2. SUW-E0048: Power Supply (E3640A) — DC 전압 출력 ===
  {
    name: 'SUW-E0048_Power_Supply',
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    remarks: '',
    items: [
      {
        itemNumber: 1,
        checkItem: '외관 검사',
        checkCriteria: '마모 상태 확인',
        checkResult: '이상 없음',
        judgment: 'pass',
      },
      {
        itemNumber: 2,
        checkItem: 'DC 전압 출력 특성 검사',
        checkCriteria: 'Output 대비 |0.1| V 이내',
        checkResult: 'Min : 0.004 V\nMax : 0.01 V',
        judgment: 'pass',
      },
    ],
    measurementEquipment: [{ equipmentId: SEED_EQUIPMENT.SENSOR, calibrationDate: '2025-07-25' }],
    resultSections: [
      { sortOrder: 0, sectionType: 'title', title: '측정 결과' },
      {
        sortOrder: 1,
        sectionType: 'data_table',
        title: 'DC 전압 출력 특성 검사',
        tableData: {
          headers: ['DC (V)', 'Multimeter (V)', 'Deviation (V)'],
          rows: [
            ['1.00', '0.996', '0.004'],
            ['2.00', '1.995', '0.005'],
            ['3.00', '2.994', '0.006'],
            ['4.00', '3.990', '0.010'],
            ['5.00', '4.989', '0.011'],
            ['6.00', '5.989', '0.011'],
            ['7.00', '6.988', '0.012'],
            ['8.00', '7.988', '0.012'],
            ['9.00', '8.988', '0.012'],
            ['10.00', '9.988', '0.012'],
            ['11.00', '10.987', '0.013'],
            ['12.00', '11.987', '0.013'],
            ['13.00', '12.986', '0.014'],
            ['14.00', '13.986', '0.014'],
            ['15.00', '14.986', '0.014'],
            ['16.00', '15.986', '0.014'],
            ['17.00', '16.984', '0.016'],
            ['18.00', '17.984', '0.016'],
            ['19.00', '18.984', '0.016'],
            ['20.00', '19.983', '0.017'],
          ],
        },
      },
      {
        sortOrder: 2,
        sectionType: 'text',
        title: '',
        content:
          '■ DC 1~20 V 전 구간에서 Deviation 최대 0.017 V → |0.1| V 이내 합격.\n' +
          '■ 전원 공급기 외관 및 커넥터 상태 양호.',
      },
    ],
  },

  // === 3. SUW-E0280: Power Sensor (NRP8S) — RF 주파수별 + photo ===
  {
    name: 'SUW-E0280_Power_Sensor',
    classification: 'calibrated',
    inspectionCycle: '6개월',
    calibrationValidityPeriod: '1년',
    remarks: '',
    items: [
      {
        itemNumber: 1,
        checkItem: '외관 검사',
        checkCriteria: '마모 상태 확인',
        checkResult: '이상 없음',
        judgment: 'pass',
      },
      {
        itemNumber: 2,
        checkItem: '출력 특성 점검',
        checkCriteria: '제조사 선언 오차범위 이내 (0 dBm 기준 ±0.5 dB)',
        checkResult: 'Min : -0.26 dB\nMax : 0.22 dB',
        judgment: 'pass',
      },
    ],
    measurementEquipment: [
      { equipmentId: SEED_EQUIPMENT.SIGNAL_GENERATOR, calibrationDate: '2025-12-30' },
    ],
    resultSections: [
      { sortOrder: 0, sectionType: 'title', title: '측정 결과' },
      {
        sortOrder: 1,
        sectionType: 'data_table',
        title: '출력 특성 점검',
        tableData: {
          headers: ['Freq (MHz)', 'SG Power (dBm)', 'Reading (dBm)', 'Deviation (dB)'],
          rows: [
            ['50', '0', '-0.05', '0.05'],
            ['1000', '0', '-0.13', '0.13'],
            ['2000', '0', '0.03', '0.03'],
            ['4000', '0', '0.22', '0.22'],
            ['6000', '0', '-0.11', '0.11'],
            ['8000', '0', '0.07', '0.07'],
            ['10000', '0', '-0.26', '0.26'],
            ['12000', '0', '-0.18', '0.18'],
            ['14000', '0', '0.09', '0.09'],
            ['16000', '0', '-0.14', '0.14'],
            ['18000', '0', '0.15', '0.15'],
          ],
        },
      },
      {
        sortOrder: 2,
        sectionType: 'text',
        title: '',
        content:
          '■ 전 대역(50 MHz – 18 GHz) Deviation 최대 0.26 dB → ±0.5 dB 이내 합격.\n' +
          '■ 10 GHz 부근 -0.26 dB로 가장 큰 편차 관찰, 규격 내.\n' +
          '■ Connector 상태 양호, Zeroing 정상 동작 확인.',
      },
      // photo/rich_table은 아래에서 동적 추가 (documentId 필요)
    ],
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('=== 실제 양식 데이터 기반 중간점검 DOCX 생성 ===\n');

  const teToken = await getToken('test_engineer');
  const tmToken = await getToken('technical_manager');
  const lmToken = await getToken('lab_manager');
  console.log('✓ 토큰 획득 완료');

  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const imgDir = path.join(__dirname, '..', 'shared', 'fixtures', 'images');

  for (const spec of SPECS) {
    console.log(`\n--- ${spec.name} ---`);

    // 1. 생성
    const createData = await api(
      'POST',
      `/api/calibration/${CALIB_ID}/intermediate-inspections`,
      teToken,
      {
        calibrationId: CALIB_ID,
        inspectionDate: today,
        classification: spec.classification,
        inspectionCycle: spec.inspectionCycle,
        calibrationValidityPeriod: spec.calibrationValidityPeriod,
        overallResult: 'pass',
        remarks: spec.remarks,
        items: spec.items,
        measurementEquipment: spec.measurementEquipment,
      }
    );
    const inspectionId = (createData.id as string) ?? (createData.uuid as string);
    console.log(`  ✓ 생성: ${inspectionId.substring(0, 8)}...`);

    // 2. 결과 섹션
    for (const section of spec.resultSections) {
      await api(
        'POST',
        `/api/intermediate-inspections/${inspectionId}/result-sections`,
        teToken,
        section
      );
    }

    // 3. Power Sensor에만 photo + rich_table 추가
    if (spec.name.includes('Power_Sensor')) {
      const photoId = await uploadPng(
        teToken,
        path.join(imgDir, 'test-photo-red.png'),
        'setup-photo.png',
        inspectionId
      );
      const richImg1 = await uploadPng(
        teToken,
        path.join(imgDir, 'test-photo-blue.png'),
        'spectrum-1ghz.png',
        inspectionId
      );
      const richImg2 = await uploadPng(
        teToken,
        path.join(imgDir, 'test-photo-green.png'),
        'spectrum-18ghz.png',
        inspectionId
      );

      await api('POST', `/api/intermediate-inspections/${inspectionId}/result-sections`, teToken, {
        sortOrder: 3,
        sectionType: 'photo',
        title: '측정 셋업 사진',
        documentId: photoId,
        imageWidthCm: 14,
        imageHeightCm: 10,
      });

      await api('POST', `/api/intermediate-inspections/${inspectionId}/result-sections`, teToken, {
        sortOrder: 4,
        sectionType: 'rich_table',
        title: '주파수별 스펙트럼 캡처',
        richTableData: {
          headers: ['주파수', '스펙트럼', '판정'],
          rows: [
            [
              { type: 'text', value: '1 GHz' },
              { type: 'image', documentId: richImg1, widthCm: 6, heightCm: 4 },
              { type: 'text', value: '합격' },
            ],
            [
              { type: 'text', value: '18 GHz' },
              { type: 'image', documentId: richImg2, widthCm: 6, heightCm: 4 },
              { type: 'text', value: '합격' },
            ],
          ],
        },
      });
      console.log('  ✓ 사진 + rich_table 추가');
    }

    console.log(`  ✓ 결과 섹션 ${spec.resultSections.length}+ 개 추가`);

    // 4. 3단계 승인
    await approve3Step(inspectionId, teToken, tmToken, lmToken);
    console.log('  ✓ 3단계 승인 완료');

    // 5. Export
    const docxBuf = await exportDocx(teToken, inspectionId);
    const outPath = path.join(outputDir, `${spec.name}_${today}.docx`);
    fs.writeFileSync(outPath, docxBuf);
    console.log(`  ✓ DOCX: ${outPath} (${(docxBuf.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ 전체 완료! 생성된 파일:');
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.docx'));
  for (const f of files) {
    const size = (fs.statSync(path.join(outputDir, f)).size / 1024).toFixed(1);
    console.log(`   ${f} (${size} KB)`);
  }
  console.log(`\n비교: docs/procedure/실제양식/ 의 원본과 대조해보세요.`);
}

main().catch((err) => {
  console.error('\n❌ 실패:', err.message);
  process.exit(1);
});
