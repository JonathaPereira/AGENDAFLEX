import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': hooks, 'jsx-a11y': a11y },
    rules: {
      ...hooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
    },
  },
  prettier,
);
