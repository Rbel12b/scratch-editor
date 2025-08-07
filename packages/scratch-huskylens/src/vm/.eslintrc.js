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
        sourceType: 'module', // allow import/export by default
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
            parser: 'espree', // default parser for JS
            parserOptions: {
                sourceType: 'script' // for CommonJS
            },
            rules: {
                // JS/JSX-specific rules (if any)
            }
        },
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: '.'
            },
            rules: {
                // TS/TSX-specific rules (if any)
            }
        }
    ],
    settings: {
        react: {
            version: 'detect'
        }
    }
};
