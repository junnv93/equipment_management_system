/**
 * Root ESLint configuration for monorepo
 * Each package/app should extend from this or define its own config
 */
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    'coverage',
    'build',
    '*.config.js',
    '*.config.ts',
  ],
  overrides: [
    // Backend (NestJS) files
    {
      files: ['apps/backend/**/*.ts'],
      extends: ['./apps/backend/.eslintrc.js'],
    },
    // Frontend (Next.js) files - uses its own eslint.config.mjs (ESLint 9 flat config)
    // Run frontend lint separately: pnpm --filter frontend run lint
    // Shared packages TypeScript files
    {
      files: ['packages/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: false, // Disable project-based linting for packages to avoid tsconfig issues
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/ban-ts-comment': 'warn',
      },
    },
  ],
};
