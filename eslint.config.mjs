import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    "**/.next/**",
    "**/dist/**",
    "**/out/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/test-results/**",
    "**/playwright-report/**",
    "**/next-env.d.ts",
    "infra/**",
    "om-ai.omdala.com/**",
    "Omone.omdala.com/**",
  ]),
  {
    files: ["packages/**/*.{js,mjs,cjs,ts,tsx}", "services/**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "@next/next/no-assign-module-variable": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
