module.exports = {
    env: {
        node: true,
        es2022: true,
        mocha: true,
    },
    extends: ['eslint:recommended', 'plugin:wdio/recommended', 'prettier'],
    plugins: ['wdio'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'no-console': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-empty': ['error', { allowEmptyCatch: true }],
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'multi-line'],
        'no-throw-literal': 'error',
        'prefer-template': 'warn',
        'no-duplicate-imports': 'error',
    },
    globals: {
        browser: 'readonly',
        $: 'readonly',
        $$: 'readonly',
    },
    ignorePatterns: ['node_modules/', 'reports/', 'logs/', 'screenshots/', 'videos/'],
};
