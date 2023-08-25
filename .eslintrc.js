module.exports = {
    root: true,
    env: {
        node: true, es6: true, "jest/globals": true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        "project": "./tsconfig.json", "sourceType": "module"
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "plugin:jest/recommended",
        "plugin:jest/style"
    ],
    plugins: ["import", "sort-keys-fix", "unused-imports", "jest"],
    rules: {
        "import/order": ["error", {
            "groups": ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
            "newlines-between": "always",
            "alphabetize": {
                "order": "asc"
            }
        }],
        "import/no-duplicates": "error",
        "import/no-unresolved": "error",
        "sort-keys-fix/sort-keys-fix": "error",
        "unused-imports/no-unused-imports": "error",
        "jest/consistent-test-it": ["error", {"fn": "it"}],
        "jest/require-top-level-describe": ["error"],
        "@typescript-eslint/no-unused-vars": ["error", {"ignoreRestSiblings": true}]
    },
    overrides: [
        {
            files: ["test/**", "**/*.spec.ts"],
            plugins: ["jest"],
            extends: ["plugin:jest/recommended"],
            rules: {"jest/prefer-expect-assertions": "off"}
        }
    ],
    ignorePatterns: [".eslintrc.js"],
    settings: {
        jest: {
            version: require("jest/package.json").version
        },
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"]
        },
        "import/resolver": {
            "typescript": {
                "alwaysTryTypes": true
            }
        }
    }
};
