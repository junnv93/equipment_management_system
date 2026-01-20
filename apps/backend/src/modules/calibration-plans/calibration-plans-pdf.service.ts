import { Injectable } from '@nestjs/common';
import { CalibrationPlansService } from './calibration-plans.service';

// 시험소 라벨
const SITE_LABELS: Record<string, string> = {
  suwon: '수원',
  uiwang: '의왕',
};

// 상태 라벨
const STATUS_LABELS: Record<string, string> = {
  draft: '작성 중',
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

@Injectable()
export class CalibrationPlansPdfService {
  constructor(private readonly calibrationPlansService: CalibrationPlansService) {}

  /**
   * 교정계획서 HTML 생성 (브라우저에서 인쇄하여 PDF로 저장)
   */
  async generatePdf(uuid: string): Promise<Buffer> {
    const plan = await this.calibrationPlansService.findOne(uuid);
    const items = plan.items || [];

    const formatDate = (dateVal: Date | string | null | undefined) => {
      if (!dateVal) return '-';
      const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      return date.toLocaleDateString('ko-KR');
    };

    // HTML 생성
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${plan.year}년 ${SITE_LABELS[plan.siteId] || plan.siteId} 교정계획서</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm;
    }
    body {
      font-family: 'Malgun Gothic', sans-serif;
      font-size: 10px;
      margin: 0;
      padding: 20px;
    }
    h1 {
      text-align: center;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .info {
      margin-bottom: 20px;
      font-size: 11px;
    }
    .info p {
      margin: 2px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    th, td {
      border: 1px solid #333;
      padding: 4px;
      text-align: center;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .section-header {
      background-color: #e0e0e0;
    }
    .confirmed {
      color: green;
      font-weight: bold;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <h1>${plan.year}년 ${SITE_LABELS[plan.siteId] || plan.siteId} 교정계획서</h1>

  <div class="info">
    <p><strong>상태:</strong> ${STATUS_LABELS[plan.status] || plan.status}</p>
    <p><strong>작성자:</strong> ${plan.createdBy}</p>
    <p><strong>작성일:</strong> ${formatDate(plan.createdAt)}</p>
    ${plan.approvedBy ? `<p><strong>승인자:</strong> ${plan.approvedBy}</p>` : ''}
    ${plan.approvedAt ? `<p><strong>승인일:</strong> ${formatDate(plan.approvedAt)}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr class="section-header">
        <th rowspan="2">순번</th>
        <th rowspan="2">관리번호</th>
        <th rowspan="2">장비명</th>
        <th colspan="3">현황</th>
        <th colspan="3">계획</th>
        <th rowspan="2">비고</th>
      </tr>
      <tr>
        <th>유효일자</th>
        <th>교정주기</th>
        <th>교정기관</th>
        <th>교정일자</th>
        <th>교정기관</th>
        <th>확인</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item: any) => `
        <tr>
          <td>${item.sequenceNumber}</td>
          <td>${item.equipment?.managementNumber || '-'}</td>
          <td>${item.equipment?.name || '-'}</td>
          <td>${formatDate(item.snapshotValidityDate)}</td>
          <td>${item.snapshotCalibrationCycle ? `${item.snapshotCalibrationCycle}개월` : '-'}</td>
          <td>${item.snapshotCalibrationAgency || '-'}</td>
          <td>${formatDate(item.plannedCalibrationDate)}</td>
          <td>${item.plannedCalibrationAgency || '-'}</td>
          <td>${item.confirmedBy ? '<span class="confirmed">O</span>' : '-'}</td>
          <td>${item.actualCalibrationDate ? formatDate(item.actualCalibrationDate) : item.notes || '-'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <script>
    // 페이지 로드 후 자동 인쇄 (선택사항)
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
    `.trim();

    return Buffer.from(html, 'utf-8');
  }
}
