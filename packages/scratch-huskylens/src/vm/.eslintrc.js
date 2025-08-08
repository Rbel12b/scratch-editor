module.exports =
{
    root: true,
    env: {
        browser: true,
        node: true,
        es6: true
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    plugins: ['@typescript-eslint', 'react'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'scratch',
        'scratch/es6'
    ],
    overrides: [
        {
            files: ['*.js', '*.jsx'],
            parser: 'espree',
            parserOptions: {
                sourceType: 'script'
            }
        },
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: '.'
            }
        }
    ],
    settings: {
        react: {
            version: 'detect'
        }
    }
};
