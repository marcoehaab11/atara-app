import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.cache/**', 'android/app/src/main/assets/**', 'android/**/build/**'] },
  ...tseslint.configs.recommended,
];
