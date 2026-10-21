import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ["ref/**", "webflow-map/paste/**", "webflow-map/public/**"],
  },
  // Reference material and generated, size-limited Webflow snippets must not be reformatted.
  fmt: { ignorePatterns: ["ref/**", "webflow-map/paste/**", "webflow-map/public/**"] },
});
