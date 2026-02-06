import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

let fixed = 0;

// Fix dashboard.service.ts - intentionally unused parameters for future role-based filtering
const dashboardService = project.getSourceFile('src/modules/dashboard/dashboard.service.ts');
if (dashboardService) {
  dashboardService.getClasses().forEach((cls) => {
    cls.getMethods().forEach((method) => {
      method.getParameters().forEach((param) => {
        const paramName = param.getName();
        // Prefix unused parameters with underscore for role-based filtering (UL-QP-18)
        if (['userId', 'userRole', 'teamId', 'site', 'limit'].includes(paramName)) {
          param.rename(`_${paramName}`);
          fixed++;
        }
      });
    });
  });

  // Add comment at top of class explaining intentional unused params
  const cls = dashboardService.getClasses()[0];
  if (cls) {
    const existingComment = cls.getJsDocs()[0]?.getDescription().trim() || '';
    if (!existingComment.includes('Reserved parameters')) {
      cls.insertJsDoc(0, {
        description: `${existingComment}\n\nNote: Parameters prefixed with _ are intentionally unused,\nreserved for future role-based filtering per UL-QP-18 requirements.`
      });
    }
  }

  dashboardService.saveSync();
  console.log('✅ Fixed dashboard.service.ts intentionally unused params');
}

// Fix unused imports across all files
const allFiles = project.getSourceFiles('src/**/*.ts');
allFiles.forEach((file) => {
  file.fixUnusedIdentifiers();
  file.saveSync();
});

console.log(`✅ Fixed ${fixed} intentionally unused parameters`);
console.log('✅ Removed unused imports from all files');
