# iterable-to-stream
Convert iterable objects into node readable streams.

```typescript
import iterableToStream from 'iterable-to-stream';

iterableToStream(['one', 'two', 'three']).pipe(process.stdout);
```

