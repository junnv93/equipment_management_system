/**
 * DOCX 구조 분석 스크립트
 * 실제 중간점검 문서의 테이블/이미지/텍스트 구조를 추출합니다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import PizZip from 'pizzip';

const DIR = join(import.meta.dirname, 'intermediate-inspections');

function analyzeDocx(filePath) {
  const buf = readFileSync(filePath);
  const zip = new PizZip(buf);
  const xml = zip.file('word/document.xml').asText();

  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));

  const tables = [];
  const tableRegex = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
  let match;
  while ((match = tableRegex.exec(xml)) !== null) {
    const tableXml = match[0];
    const rows = [];
    const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableXml)) !== null) {
      const rowXml = rowMatch[0];
      const cells = [];
      const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
        const cellXml = cellMatch[0];
        // Extract text: find all <w:t ...>content</w:t> but NOT inside w:tcPr
        const withoutTcPr = cellXml.replace(/<w:tcPr[\s>][\s\S]*?<\/w:tcPr>/g, '');
        // Strip all XML tags to get plain text
        const plainText = withoutTcPr
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const hasImage = cellXml.includes('<w:drawing>') || cellXml.includes('<w:pict>');
        const imageCount = (cellXml.match(/<w:drawing>/g) || []).length;
        cells.push({ text: plainText.substring(0, 80), hasImage, imageCount });
      }
      rows.push(cells);
    }
    tables.push(rows);
  }

  const betweenTables = [];
  const nonTableContent = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, '|||TABLE|||');
  const parts = nonTableContent.split('|||TABLE|||');
  for (let i = 0; i < parts.length; i++) {
    const texts = [];
    const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let textMatch;
    while ((textMatch = textRegex.exec(parts[i])) !== null) {
      if (textMatch[1].trim()) texts.push(textMatch[1].trim());
    }
    const hasImage = parts[i].includes('<w:drawing>');
    if (texts.length > 0 || hasImage) {
      betweenTables.push({ position: i, texts, hasImage });
    }
  }

  return { tables, mediaFiles, betweenTables };
}

const files = readdirSync(DIR).filter(f => f.endsWith('.docx'));

for (const file of files) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE: ${file}`);
  console.log(`${'='.repeat(80)}`);

  const result = analyzeDocx(join(DIR, file));

  console.log(`\nImages in media/: ${result.mediaFiles.length} files`);
  console.log(`Tables: ${result.tables.length}`);

  for (let t = 0; t < result.tables.length; t++) {
    const table = result.tables[t];
    console.log(`\n--- Table ${t} (${table.length} rows) ---`);
    for (let r = 0; r < Math.min(table.length, 10); r++) {
      const cells = table[r].map(c => {
        let label = c.text || '(empty)';
        if (c.hasImage) label += ` [IMG*${c.imageCount}]`;
        return label.substring(0, 50);
      });
      console.log(`  Row ${r}: ${JSON.stringify(cells)}`);
    }
    if (table.length > 10) {
      console.log(`  ... (${table.length - 10} more rows)`);
      const last = table[table.length - 1];
      const cells = last.map(c => {
        let label = c.text || '(empty)';
        if (c.hasImage) label += ` [IMG*${c.imageCount}]`;
        return label.substring(0, 50);
      });
      console.log(`  Row ${table.length - 1}: ${JSON.stringify(cells)}`);
    }

    const imageCells = [];
    for (let r = 0; r < table.length; r++) {
      for (let c = 0; c < table[r].length; c++) {
        if (table[r][c].hasImage) {
          imageCells.push(`R${r}C${c}(*${table[r][c].imageCount})`);
        }
      }
    }
    if (imageCells.length > 0) {
      console.log(`  IMG at: ${imageCells.join(', ')}`);
    }
  }

  if (result.betweenTables.length > 0) {
    console.log(`\n--- Content between tables ---`);
    for (const bt of result.betweenTables) {
      const preview = bt.texts.slice(0, 5).join(' | ');
      console.log(`  Pos ${bt.position}: ${preview.substring(0, 100)}${bt.hasImage ? ' [HAS_IMAGE]' : ''}`);
    }
  }
}
