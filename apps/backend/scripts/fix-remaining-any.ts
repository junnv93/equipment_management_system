import { Project } from 'ts-morph';
import * as fs from 'fs';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

let fixed = 0;

// Files to fix (excluding test files and type definitions)
const filesToFix = [
  'src/modules/users/users.service.ts',
  'src/modules/equipment/services/equipment-attachment.service.ts',
  'src/modules/auth/auth.controller.ts',
  'src/modules/non-conformances/non-conformances.service.ts',
  'src/common/filters/error.filter.ts',
  'src/common/pipes/zod-validation.pipe.ts',
  'src/common/cache/cache.service.ts',
];

filesToFix.forEach((filePath) => {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = sourceFile.getFullText();
  let modified = false;

  // Replace common any patterns
  const replacements = [
    { from: /Record<string, any>/g, to: 'Record<string, unknown>' },
    { from: /: any\[\]/g, to: ': unknown[]' },
    { from: /: any\)/g, to: ': unknown)' },
    { from: /: any;/g, to: ': unknown;' },
    { from: /: any =/g, to: ': unknown =' },
    { from: /\(error: any\)/g, to: '(error: unknown)' },
    { from: /catch \(error: any\)/g, to: 'catch (error: unknown)' },
    { from: /catch \(error\) \{/g, to: 'catch (error: unknown) {' },
    { from: /catch \(err\) \{/g, to: 'catch (err: unknown) {' },
    // Remove unnecessary as any casts
    { from: / as any;/g, to: ';' },
    { from: / as any\)/g, to: ')' },
    { from: / as any,/g, to: ',' },
  ];

  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      modified = true;
      fixed++;
    }
  });

  if (modified) {
    sourceFile.replaceWithText(content);
    sourceFile.saveSync();
    console.log(`✅ Fixed ${filePath}`);
  }
});

console.log(`\n✅ Total replacements: ${fixed}`);
