const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const tseslint = require("@typescript-eslint/eslint-plugin");
const reactCompiler = require("eslint-plugin-react-compiler");

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      "@typescript-eslint": tseslint,
      "react-compiler": reactCompiler,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "react-compiler/react-compiler": "warn",
    },
  },
  {
    ignores: ["dist/*"],
  },
]);
