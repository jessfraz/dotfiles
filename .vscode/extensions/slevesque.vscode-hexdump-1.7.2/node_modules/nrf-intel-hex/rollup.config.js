
import buble from 'rollup-plugin-buble';
import pkg from './package.json';

export default [
    // browser-friendly UMD build
    {
        input: pkg.module,
        output: {
            file: pkg.browser,
            format: 'umd',
            sourcemap: true
        },
        name: 'MemoryMap',
        plugins: [
            buble({
                transforms: { forOf: false }
            }),
        ]
    },

    {
        input: pkg.module,
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true },
//             { file: pkg.module, format: 'es', sourcemap: true }
        ],
        plugins: [
            buble({
                transforms: { forOf: false }
            }),
        ]
    }
];
