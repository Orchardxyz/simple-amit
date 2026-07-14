import oryz from "@oryz/eslint-config";
import svelte from "eslint-plugin-svelte";
import ts from "typescript-eslint";

export default [
  ...oryz(),
  ...svelte.configs.recommended,
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        projectService: true
      }
    }
  }
];
