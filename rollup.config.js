import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
  external: [/node_modules/],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: true,
      compilerOptions: {
        target: "es2018",
        module: "esnext",
      },
    }),
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
  ],
};
