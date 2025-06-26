import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/mini-framework.js',
      format: 'umd',
      name: 'MiniFramework',
      sourcemap: !isProduction
    },
    {
      file: 'dist/mini-framework.esm.js',
      format: 'esm',
      sourcemap: !isProduction
    }
  ],
  plugins: [
    nodeResolve(),
    ...(isProduction ? [terser()] : [])
  ]
};