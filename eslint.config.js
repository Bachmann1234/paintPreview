import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        alert: "readonly",
        Image: "readonly",
        Blob: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        Uint8Array: "readonly",
        Int8Array: "readonly",
        Map: "readonly",
        console: "readonly",
        confirm: "readonly",
        prompt: "readonly",
      },
    },
  },
  {
    ignores: ["node_modules/", "coverage/"],
  },
];
