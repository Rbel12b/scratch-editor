module.exports = {
    root: true,
    plugins: ['jest'],
    env: {
        browser: true,
        es6: true,
        jest: true,
    },
    rules: {
        'react/prop-types': 0
    },
    parserOptions: {
        sourceType: "module",
    },
};
