import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

let fixed = 0;

// Fix decorators with missing return types
const decoratorFiles = project.getSourceFiles('src/common/decorators/**/*.ts');
decoratorFiles.forEach((file) => {
  const functions = file.getFunctions();
  const variables = file.getVariableDeclarations();

  // Fix arrow function decorators
  variables.forEach((variable) => {
    const initializer = variable.getInitializer();
    if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
      const arrow = initializer.asKindOrThrow(SyntaxKind.ArrowFunction);
      if (!arrow.getReturnTypeNode()) {
        const name = variable.getName();
        // Add appropriate return type for decorators
        if (name.includes('decorator') || name === 'AuditLog' || name === 'SkipGlobalValidation' || name === 'Public') {
          arrow.setReturnType('MethodDecorator');
          fixed++;
        }
      }
    }
  });

  file.saveSync();
});

console.log(`✅ Fixed ${fixed} decorator return types`);

// Fix helper functions with missing return types
const helperFiles = project.getSourceFiles([
  'src/common/helpers/**/*.ts',
  'src/common/utils/**/*.ts'
]);

helperFiles.forEach((file) => {
  const functions = file.getFunctions();

  functions.forEach((func) => {
    if (!func.getReturnTypeNode()) {
      const signature = func.getSignature();
      const returnType = signature.getReturnType();
      const typeText = returnType.getText();

      func.setReturnType(typeText);
      fixed++;
    }
  });

  file.saveSync();
});

console.log(`✅ Fixed helper function return types`);
console.log(`Total fixes: ${fixed}`);
