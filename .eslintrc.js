module.exports = {
  extends: 'erb',
  plugins: ['@typescript-eslint'],
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-import-module-exports': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    // Functional components document optional props via `?:` in their TS
    // interface; a parallel defaultProps declaration is redundant busywork
    // this codebase doesn't do anywhere (React no longer supports
    // defaultProps on function components without a deprecation warning).
    'react/require-default-props': 'off',
    // Hook/util files in this codebase consistently use named exports
    // (useItems, useRecipes, ...) even when a file has just one right now.
    'import/prefer-default-export': 'off',
    // "busy ? 'Saving…' : isEdit ? 'Save' : 'Create'" three-way button-label
    // switches read fine flat; used throughout the inventory forms.
    'no-nested-ternary': 'off',
  },
  overrides: [
    {
      // shadcn/ui primitives: generated components that wrap a Radix/native
      // element and forward all props through by design.
      files: ['src/renderer/components/ui/**/*.{ts,tsx}'],
      rules: {
        'react/jsx-props-no-spreading': 'off',
        'react/require-default-props': 'off',
        'react/prop-types': 'off',
        'jsx-a11y/heading-has-content': 'off',
        'import/prefer-default-export': 'off',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
