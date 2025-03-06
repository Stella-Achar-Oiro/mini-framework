// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/framework.esm.js',
      format: 'esm'
    },
    plugins: [resolve(), commonjs()]
  },
  // UMD build (minified)
  {
    input: 'src/index.js',
    output: {
      name: 'MiniFramework',
      file: 'dist/framework.min.js',
      format: 'umd'
    },
    plugins: [resolve(), commonjs(), terser()]
  }
];