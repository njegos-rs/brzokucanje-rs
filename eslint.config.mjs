import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // React Compiler diagnostics are not enabled for this app. The typing engine
    // intentionally uses imperative keyboard/timer refs and effects.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      // The repository contains standalone CommonJS maintenance scripts.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;




