import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 10 },
      ],
      'jsx-a11y/no-autofocus': 'error',
    },
  },
  {
    // Scene code drives three.js objects imperatively inside the frame loop; the React-compiler
    // style immutability rule does not model that, and R3F elements use non-DOM props.
    files: ['src/components/canvas/**/*.{ts,tsx}'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
    // Milestone 2 static design reference — kept as-is, not part of the application.
    'prototype/**',
    'docs/**',
  ]),
]);
