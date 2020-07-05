export { default as astSerializer } from './astSerializer';
export { default as selectionSetSerializer } from './selectionSetSerializer';
export { default as typeSerializer } from './typeSerializer';
export { default as graphqlErrorSerializer } from './graphqlErrorSerializer';
declare global {
    namespace jest {
        interface Expect {
            addSnapshotSerializer(serializer: import('pretty-format').Plugin): void;
        }
    }
}
//# sourceMappingURL=index.d.ts.map