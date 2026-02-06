import { Project, SyntaxKind, Node } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

let fixed = 0;

// Patterns to fix
const patterns = [
  {
    files: 'src/**/*.seed.ts',
    description: 'Seed files - Drizzle query results',
    replacements: [
      { from: 'const result: any', to: 'const result: unknown' },
      { from: ': any[]', to: ': unknown[]' },
      { from: ': any)', to: ': unknown)' },
    ]
  },
  {
    files: 'src/**/*interceptor.ts',
    description: 'Interceptors - Observable types',
    replacements: [
      { from: 'Observable<any>', to: 'Observable<unknown>' },
      { from: ': any)', to: ': unknown)' },
    ]
  },
  {
    files: 'src/**/*.controller.ts',
    description: 'Controllers - Request/Response types',
    replacements: [
      { from: '@UploadedFile() file: any', to: '@UploadedFile() file: Express.Multer.File' },
      { from: 'as any', to: 'as unknown' },
    ]
  },
];

patterns.forEach(({ files, description, replacements }) => {
  console.log(`Processing: ${description}`);
  const sourceFiles = project.getSourceFiles(files);

  sourceFiles.forEach((file) => {
    let content = file.getFullText();
    let modified = false;

    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        modified = true;
        fixed++;
      }
    });

    if (modified) {
      file.replaceWithText(content);
      file.saveSync();
    }
  });
});

console.log(`✅ Fixed ${fixed} any type patterns`);

// Now do more sophisticated fixes for specific files
const authController = project.getSourceFile('src/modules/auth/auth.controller.ts');
if (authController) {
  const content = authController.getFullText();
  const newContent = content
    .replace(/req: any/g, 'req: Request')
    .replace(/res: any/g, 'res: Response');

  if (content !== newContent) {
    // Add imports if needed
    const hasRequestImport = content.includes("import { Request");
    if (!hasRequestImport) {
      authController.addImportDeclaration({
        moduleSpecifier: 'express',
        namedImports: ['Request', 'Response'],
      });
    }
    authController.replaceWithText(newContent);
    authController.saveSync();
    console.log('✅ Fixed auth.controller.ts');
  }
}

console.log('✅ Any types cleanup complete');
