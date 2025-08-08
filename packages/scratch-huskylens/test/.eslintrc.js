module.exports = {
    root: true,
    plugins: ['@typescript-eslint', 'jest'],
    env: {
        browser: true,
        es6: true,
        jest: true,
    },
    rules: {
        'react/prop-types': 0
    },
    parserOptions: {
        sourceType: 'module',
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 2020,
                project: './tsconfig.json',
            },
            extends: ['plugin:@typescript-eslint/recommended'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
            },
        },
    ]
};
