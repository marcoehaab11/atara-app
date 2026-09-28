import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.cache/**'] },
  ...tseslint.configs.recommended,
];
