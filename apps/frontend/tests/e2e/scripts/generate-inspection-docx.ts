/**
 * 중간점검 전체 섹션 타입 DOCX 생성 스크립트
 *
 * 사용법: npx tsx tests/e2e/scripts/generate-inspection-docx.ts
 *
 * 1. test-login으로 JWT 획득
 * 2. 중간점검 생성 (3개 점검항목)
 * 3. 사진 3장 업로드 (PNG)
 * 4. 결과 섹션 5가지 타입 모두 추가 (title/data_table/text/photo/rich_table)
 * 5. 3단계 승인 (submit → review → approve)
 * 6. DOCX export → 파일 저장
 */

import * as fs from 'fs';
import * as path from 'path';

const BACKEND = 'http://localhost:3001';
const CALIB_ID = 'bbbb0001-0001-0001-0001-000000000001'; // CALIB_001
const today = new Date().toISOString().split('T')[0];

async function getToken(role: string): Promise<string> {
  const resp = await fetch(`${BACKEND}/api/auth/test-login?role=${role}`);
  if (!resp.ok) throw new Error(`test-login failed: ${resp.status}`);
  const data = await resp.json();
  return data.access_token ?? data.token ?? data.accessToken;
}

async function api(
  method: string,
  path: string,
  token: string,
  body?: Record<string, unknown>
): Promise<{ status: number; data: Record<string, unknown> }> {
  const resp = await fetch(`${BACKEND}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, data: data as Record<string, unknown> };
}

async function uploadFile(
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
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Upload failed (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return (data as { document: { id: string } }).document.id;
}

async function getVersion(token: string, inspectionId: string): Promise<number> {
  const { data } = await api('GET', `/api/intermediate-inspections/${inspectionId}`, token);
  return (data.version as number) ?? 1;
}

async function main() {
  console.log('=== 중간점검 전체 섹션 타입 DOCX 생성 ===\n');

  // 0. 기존 데이터 정리 (캐시 클리어)
  await fetch(`${BACKEND}/api/auth/test-cache-clear`, { method: 'POST' }).catch(() => {});

  // 1. 토큰 획득
  const teToken = await getToken('test_engineer');
  const tmToken = await getToken('technical_manager');
  const lmToken = await getToken('lab_manager');
  console.log('✓ 토큰 획득 완료 (TE/TM/LM)');

  // 2. 중간점검 생성
  const { status: createStatus, data: createData } = await api(
    'POST',
    `/api/calibration/${CALIB_ID}/intermediate-inspections`,
    teToken,
    {
      calibrationId: CALIB_ID,
      inspectionDate: today,
      classification: 'calibrated',
      inspectionCycle: '6개월',
      calibrationValidityPeriod: '1년',
      overallResult: 'pass',
      remarks: '전체 섹션 타입 통합 테스트 — title/data_table/text/photo/rich_table',
      items: [
        {
          itemNumber: 1,
          checkItem: '외관 점검',
          checkCriteria: '파손, 변형, 부식 여부 확인',
          checkResult: '이상 없음',
          judgment: 'pass',
        },
        {
          itemNumber: 2,
          checkItem: '전기 안전 점검',
          checkCriteria: '접지 저항 < 0.1Ω',
          checkResult: '0.05Ω (합격)\n접지선 상태 양호\n절연저항 500MΩ 이상',
          judgment: 'pass',
        },
        {
          itemNumber: 3,
          checkItem: '출력 특성 점검 (RF Gain)',
          checkCriteria: '제조사 사양 범위 이내 (45 ± 2.5 dB)',
          checkResult: 'Min: 43.8 dB, Max: 46.5 dB — 전 대역 합격',
          judgment: 'pass',
        },
      ],
    }
  );

  if (createStatus !== 201) {
    throw new Error(`중간점검 생성 실패: ${createStatus} — ${JSON.stringify(createData)}`);
  }
  const inspectionId = (createData.id as string) ?? (createData.uuid as string);
  console.log(`✓ 중간점검 생성: ${inspectionId}`);

  // 3. 사진 업로드 (3장)
  const imgDir = path.join(__dirname, '..', 'shared', 'fixtures', 'images');
  const photoId = await uploadFile(
    teToken,
    path.join(imgDir, 'test-photo-red.png'),
    'setup-photo.png',
    inspectionId
  );
  const richImg1 = await uploadFile(
    teToken,
    path.join(imgDir, 'test-photo-blue.png'),
    'spectrum-low.png',
    inspectionId
  );
  const richImg2 = await uploadFile(
    teToken,
    path.join(imgDir, 'test-photo-green.png'),
    'spectrum-high.png',
    inspectionId
  );
  console.log(`✓ 사진 3장 업로드: ${photoId.substring(0, 8)}...`);

  // 4. 결과 섹션 5가지 타입 추가
  const sections = [
    {
      sortOrder: 0,
      sectionType: 'title',
      title: '측정 결과 상세 (RF Pre-Amplifier Gain Test)',
    },
    {
      sortOrder: 1,
      sectionType: 'data_table',
      title: 'Gain vs Frequency (1–18 GHz)',
      tableData: {
        headers: ['Frequency (GHz)', 'Gain (dB)', 'Spec Min', 'Spec Max', 'Result'],
        rows: [
          ['1.0', '44.12', '42.5', '47.5', 'PASS'],
          ['2.0', '44.35', '42.5', '47.5', 'PASS'],
          ['4.0', '44.89', '42.5', '47.5', 'PASS'],
          ['6.0', '45.01', '42.5', '47.5', 'PASS'],
          ['8.0', '45.23', '42.5', '47.5', 'PASS'],
          ['10.0', '45.67', '42.5', '47.5', 'PASS'],
          ['12.0', '46.01', '42.5', '47.5', 'PASS'],
          ['14.0', '46.22', '42.5', '47.5', 'PASS'],
          ['16.0', '46.55', '42.5', '47.5', 'PASS'],
          ['18.0', '46.73', '42.5', '47.5', 'PASS'],
        ],
      },
    },
    {
      sortOrder: 2,
      sectionType: 'text',
      title: '분석 결과 및 소견',
      content:
        '1–18 GHz 전 대역에서 Gain 범위 44.12~46.73 dB로 제조사 사양(45 ± 2.5 dB) 이내.\n' +
        '고주파 대역(12–18 GHz)에서 약간의 상승 경향이 관찰되나 규격 범위 내에 있어 문제 없음.\n' +
        '다음 점검 시 고주파 대역 추이를 재확인할 것을 권장.',
    },
    {
      sortOrder: 3,
      sectionType: 'photo',
      title: '측정 셋업 사진',
      documentId: photoId,
      imageWidthCm: 14,
      imageHeightCm: 10,
    },
    {
      sortOrder: 4,
      sectionType: 'rich_table',
      title: '주파수별 스펙트럼 캡처',
      richTableData: {
        headers: ['주파수 대역', '스펙트럼 캡처', '판정'],
        rows: [
          [
            { type: 'text', value: '1–6 GHz (저대역)' },
            { type: 'image', documentId: richImg1, widthCm: 6, heightCm: 4 },
            { type: 'text', value: '합격' },
          ],
          [
            { type: 'text', value: '6–18 GHz (고대역)' },
            { type: 'image', documentId: richImg2, widthCm: 6, heightCm: 4 },
            { type: 'text', value: '합격' },
          ],
        ],
      },
    },
  ];

  for (const section of sections) {
    const { status } = await api(
      'POST',
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      teToken,
      section
    );
    if (status !== 201) throw new Error(`섹션 추가 실패 (${section.sectionType}): ${status}`);
  }
  console.log('✓ 결과 섹션 5가지 추가: title, data_table, text, photo, rich_table');

  // 5. 3단계 승인
  // Submit (TE)
  let version = await getVersion(teToken, inspectionId);
  await api('PATCH', `/api/intermediate-inspections/${inspectionId}/submit`, teToken, { version });
  console.log('✓ 제출 완료 (TE)');

  // Review (TM)
  version = await getVersion(tmToken, inspectionId);
  await api('PATCH', `/api/intermediate-inspections/${inspectionId}/review`, tmToken, { version });
  console.log('✓ 검토 완료 (TM)');

  // Approve (LM)
  version = await getVersion(lmToken, inspectionId);
  await api('PATCH', `/api/intermediate-inspections/${inspectionId}/approve`, lmToken, { version });
  console.log('✓ 승인 완료 (LM)');

  // 6. DOCX Export
  await fetch(`${BACKEND}/api/auth/test-cache-clear`, { method: 'POST' }).catch(() => {});

  const exportResp = await fetch(
    `${BACKEND}/api/reports/export/form/UL-QP-18-03?inspectionId=${inspectionId}`,
    { headers: { Authorization: `Bearer ${teToken}` } }
  );

  if (!exportResp.ok) {
    const err = await exportResp.text();
    throw new Error(`Export 실패: ${exportResp.status} — ${err}`);
  }

  const docxBuffer = Buffer.from(await exportResp.arrayBuffer());
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `WF-19e_중간점검_전체섹션_${today}.docx`);
  fs.writeFileSync(outputPath, docxBuffer);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ DOCX 생성 완료!`);
  console.log(`   파일: ${outputPath}`);
  console.log(`   크기: ${(docxBuffer.length / 1024).toFixed(1)} KB`);
  console.log(`   점검 ID: ${inspectionId}`);
  console.log(`${'='.repeat(60)}`);
  console.log('\n포함된 콘텐츠:');
  console.log('  [T0] 장비 정보 + 점검 항목 3개 (외관/전기안전/출력특성)');
  console.log('  [T1] 측정 장비 목록');
  console.log('  [T2] 점검 결과 + 결재란 (서명)');
  console.log('  [RS] title: 측정 결과 상세');
  console.log('  [RS] data_table: Gain vs Frequency (10행 5열)');
  console.log('  [RS] text: 분석 결과 및 소견 (멀티라인)');
  console.log('  [RS] photo: 측정 셋업 사진 (PNG 14×10cm)');
  console.log('  [RS] rich_table: 주파수별 스펙트럼 (텍스트+이미지 혼합 2×3)');
}

main().catch((err) => {
  console.error('\n❌ 실패:', err.message);
  process.exit(1);
});
