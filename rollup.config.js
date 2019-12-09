import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    external: ['yauzl'],
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'esm', sourcemap: true },
    ],
  },
];
