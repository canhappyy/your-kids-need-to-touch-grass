import { mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config.mjs";

export default mergeConfig(baseConfig, {
  test: {
    include: ["**/*.integration.test.ts"],
    testTimeout: 10_000,
  },
});
