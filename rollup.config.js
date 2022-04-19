import pkg from "./package.json";
console.log(pkg);
import typescript from "@rollup/plugin-typescript";

export default {
  input: "./src/index.ts",
  output: [
    //1. cjs => commonjs
    {
      format: "cjs",
      file: pkg.main,
    },
    // 2. esm
    {
      format: "es",
      file: pkg.module,
    },
  ],
  plugins: [typescript()],
};
