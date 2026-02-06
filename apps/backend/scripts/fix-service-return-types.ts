import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const services = project.getSourceFiles('src/modules/**/*.service.ts');
const common = project.getSourceFiles('src/common/**/*.service.ts');
const allFiles = [...services, ...common];

let fixed = 0;

allFiles.forEach((file) => {
  file.getClasses().forEach((cls) => {
    cls.getMethods().forEach((method) => {
      if (method.getReturnTypeNode()) return;

      const signature = method.getSignature();
      const returnType = signature.getReturnType();
      let typeText = returnType.getText();

      if (method.isAsync() && !typeText.startsWith('Promise<')) {
        typeText = `Promise<${typeText}>`;
      }

      method.setReturnType(typeText);
      fixed++;
    });
  });

  file.saveSync();
});

console.log(`✅ Fixed ${fixed} service methods`);
