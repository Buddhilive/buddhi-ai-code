import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "out/**",
    "build/**",
    "dist/**",
  ]),
]);

export default eslintConfig;
