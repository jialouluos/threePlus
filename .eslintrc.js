module.exports = {
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "parser": "@typescript-eslint/parser",
    "env": {
        "browser": true,
        "node": true
    },
    "globals": {
        "_": "readonly"
    },
    "plugins": [
        "@typescript-eslint",
    ],
    "rules": {
        "no-console": "off",
        "eqeqeq": "warn",
        "no-alert": "warn",
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/no-unused-vars": 0,
        "@typescript-eslint/no-empty-function": 0,
        "@typescript-eslint/no-inferrable-types": 0
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ]
}