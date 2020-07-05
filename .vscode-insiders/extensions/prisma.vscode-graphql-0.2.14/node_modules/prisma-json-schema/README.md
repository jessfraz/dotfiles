# prisma-json-schema

JSON schema of prisma.yml files

[![CircleCI](https://circleci.com/gh/prisma/prisma-json-schema.svg?style=shield)](https://circleci.com/gh/prisma/prisma-json-schema) [![npm version](https://badge.fury.io/js/prisma-json-schema.svg)](https://badge.fury.io/js/prisma-json-schema)

## Usage

### JSON Schema

#### As hosted URL

You can use the following URL for the current JSON schema file:

```
https://raw.githubusercontent.com/prisma/prisma-json-schema/master/src/schema.json
```

#### Import as file in Node

```js
const schema = require('prisma-json-schema/dist/schema.json')
```

#### Usage with VSCode

Add the following to your settings:

```json
{
  "yaml.schemas": {
    "https://raw.githubusercontent.com/prisma/prisma-json-schema/master/src/schema.json":
      "prisma.yml"
  }
}
```

### Typescript Definitions

```sh
yarn add prisma-json-schema
```

```ts
import { PrismaDefinition } from 'prisma-json-schema'
```

