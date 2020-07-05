module.exports = {
    extends: 'eslint:recommended',
    env: {
        node: true,
        es6: true
    },
    rules: {
        indent: ['error', 4, {SwitchCase: 1}],
        'quote-props': ['error', 'as-needed'],
        'no-cond-assign': 0,
        'no-console': 0,
        'no-control-regex': 0,
        'no-undef': 'error',
        'no-unused-vars': 'error',
        semi: ['error', 'never']
    }
}
