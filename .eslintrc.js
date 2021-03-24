module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
    	"project": "./tsconfig.json"
    },
    plugins: [
        "@typescript-eslint",
    ],
    extends: [
        "plugin:old-c-programmer/node",
    ],
    rules: {
    	"@typescript-eslint/no-floating-promises": "error"
    }
};
