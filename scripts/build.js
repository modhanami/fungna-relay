const { build } = require('esbuild');

/** @type {import('esbuild').BuildOptions} */
const commonBuildOptions = {
  outdir: 'dist',
}

/** @type {import('esbuild').BuildOptions} */
const commonElectronBuildOptions = {
  format: 'cjs',
  platform: 'node',
  target: 'node16',
}

Promise.all([
  build({
    ...commonBuildOptions,
    ...commonElectronBuildOptions,
    entryPoints: [
      'src/main.ts',
    ],
  }),
  build({
    ...commonBuildOptions,
    ...commonElectronBuildOptions,
    entryPoints: [
      'src/preload.ts'
    ],
    bundle: true
  }),
  build({
    ...commonBuildOptions,
    entryPoints: [
      'src/renderer.ts',
    ],
    bundle: true,
  })
]).then(() => {
  console.log('Build complete');
}).catch(err => {
  console.error(err);
  process.exit(1);
});