const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
    entryPoints: [
        './api/project/example/another_example/another_example_test/another_example_test.js',
        './api/project/example/conjunto_example/example_test/example_test.js',
        './index.js'
    ],
    bundle: true,
    outdir: 'dist',
    platform: 'neutral',
    format: 'esm',
    external: [
        'k6',
        'k6/*'
    ],
    alias: {
        '@utils': path.resolve(__dirname, 'api/utils'),
    },

}).catch(() => process.exit(1));