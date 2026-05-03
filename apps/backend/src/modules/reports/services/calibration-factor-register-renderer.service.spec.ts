import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import PizZip from 'pizzip';
import { CalibrationFactorRegisterRendererService } from './calibration-factor-register-renderer.service';

describe('CalibrationFactorRegisterRendererService', () => {
  const service = new CalibrationFactorRegisterRendererService();

  it('UL-QP-18-11 템플릿에 보정인자 대장 행을 렌더링한다', () => {
    const template = readFileSync(
      join(
        process.cwd(),
        '../../docs/procedure/template/UL-QP-18-11(00) 보정인자 및 파라미터 관리대장.docx'
      )
    );

    const output = service.render(
      {
        rows: [
          {
            sequence: 1,
            managementNumber: 'SUW-E0001',
            equipmentName: 'Spectrum Analyzer',
            factorLabel: 'Cable Loss: 1.2 dB',
            effectiveDate: '2026-05-03',
            checkedBy: 'Kim',
            changedDate: '2026-05-03',
          },
        ],
      },
      template
    );

    const xml = new PizZip(output).file('word/document.xml')?.asText() ?? '';

    expect(xml).toContain('SUW-E0001');
    expect(xml).toContain('Spectrum Analyzer');
    expect(xml).toContain('Cable Loss: 1.2 dB');
    expect(xml).toContain('Kim');
  });
});
