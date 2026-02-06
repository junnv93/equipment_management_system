import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const controllers = project.getSourceFiles('src/modules/**/*.controller.ts');

let fixed = 0;

controllers.forEach((file) => {
  const classes = file.getClasses();

  classes.forEach((cls) => {
    cls.getMethods().forEach((method) => {
      if (method.getReturnTypeNode()) return;

      const decorators = method.getDecorators();
      const isEndpoint = decorators.some(d =>
        ['Get', 'Post', 'Patch', 'Delete', 'Put'].includes(d.getName())
      );

      if (!isEndpoint) return;

      const signature = method.getSignature();
      const returnType = signature.getReturnType();
      const typeText = returnType.getText();

      method.setReturnType(typeText);
      fixed++;
    });
  });

  file.saveSync();
});

console.log(`✅ Fixed ${fixed} controller methods`);
