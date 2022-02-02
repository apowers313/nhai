module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "tsconfig.json",
    },
    overrides: [
        {
            files: ["**/*.js", "**/*.ts"],
        },
    ],
    ignorePatterns: [
        "*.hbs",
    ],
    plugins: [
        "@typescript-eslint",
    ],
    extends: [
        "plugin:@typescript-eslint/recommended",
        // TODO: uncomment below
        // "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:old-c-programmer/node",
    ],
    rules: {
        "@typescript-eslint/no-floating-promises": "error",
        "jsdoc/require-param-type": "off",
        "jsdoc/require-returns-type": "off",
        "sort-imports": ["error", {
            ignoreCase: false,
            ignoreDeclarationSort: false,
            ignoreMemberSort: false,
            memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
            allowSeparatedGroups: false,
        }],
        // fixes
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error"],
        // TODO: turn these off
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
    },
};
