import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // A leading underscore marks a binding that is destructured only to be
      // discarded, which is the idiomatic way to drop a key from an object.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Legacy debt, tracked rather than ignored. New code should type its
      // values; `npm run lint` enforces a warning budget that can only shrink,
      // so these cannot accumulate. See CONTRIBUTING.md.
      '@typescript-eslint/no-explicit-any': 'warn',

      // The context providers export both a component and its hook. Splitting
      // them is a refactor in its own right; until then this only costs the
      // dev-server fast refresh, never correctness.
      'react-refresh/only-export-components': 'warn',

      // Flagged in provider components that seed state from storage on mount.
      // Correct as written, but worth revisiting when those are refactored.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    // Tests intentionally build partial fixtures and stub third-party shapes.
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
