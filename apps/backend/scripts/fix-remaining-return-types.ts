import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

let fixed = 0;

// Fix all remaining functions and methods without return types
const allFiles = project.getSourceFiles([
  'src/**/*.ts',
  '!src/**/*.spec.ts', // Skip test files for now
  '!src/**/__tests__/**',
]);

allFiles.forEach((file) => {
  // Fix class methods
  file.getClasses().forEach((cls) => {
    cls.getMethods().forEach((method) => {
      if (!method.getReturnTypeNode()) {
        try {
          const signature = method.getSignature();
          const returnType = signature.getReturnType();
          let typeText = returnType.getText();

          // Clean up overly complex types
          if (typeText.length > 200) {
            if (method.isAsync()) {
              typeText = 'Promise<unknown>';
            } else {
              typeText = 'unknown';
            }
          }

          method.setReturnType(typeText);
          fixed++;
        } catch (error) {
          console.warn(`Could not infer return type for method ${method.getName()} in ${file.getFilePath()}`);
        }
      }
    });
  });

  // Fix standalone functions
  file.getFunctions().forEach((func) => {
    if (!func.getReturnTypeNode()) {
      try {
        const signature = func.getSignature();
        const returnType = signature.getReturnType();
        let typeText = returnType.getText();

        // Clean up overly complex types
        if (typeText.length > 200) {
          if (func.isAsync()) {
            typeText = 'Promise<unknown>';
          } else {
            typeText = 'unknown';
          }
        }

        func.setReturnType(typeText);
        fixed++;
      } catch (error) {
        console.warn(`Could not infer return type for function ${func.getName()} in ${file.getFilePath()}`);
      }
    }
  });

  // Fix arrow functions assigned to variables
  file.getVariableDeclarations().forEach((variable) => {
    const initializer = variable.getInitializer();
    if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
      const arrow = initializer.asKindOrThrow(SyntaxKind.ArrowFunction);
      if (!arrow.getReturnTypeNode()) {
        try {
          const signature = arrow.getSignature();
          const returnType = signature.getReturnType();
          let typeText = returnType.getText();

          // Clean up overly complex types
          if (typeText.length > 200) {
            if (arrow.isAsync()) {
              typeText = 'Promise<unknown>';
            } else {
              typeText = 'unknown';
            }
          }

          arrow.setReturnType(typeText);
          fixed++;
        } catch (error) {
          // Silently skip if can't infer
        }
      }
    }
  });

  file.saveSync();
});

console.log(`✅ Fixed ${fixed} remaining return types`);
