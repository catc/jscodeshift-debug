## jscodeshift-debug

Debug utilities for jscodeshift

#### Usage:
```ts
import debug from 'jscodeshift-debug

debug(node) // or debug(nodepath)
```


#### Example

```js
// someFileToTransform.js
import sinon from 'sinon-sandbox'

sinon.stub(I18n, 'extend');
```

```ts
import core, { API, FileInfo } from 'jscodeshift'

export default function transformer(fileInfo: FileInfo, api: API, options) {
  const j = api.jscodeshift
  const ast = j(fileInfo.source)
  ast
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        property: {
          type: 'Identifier',
          name: 'stub',
        },
        object: {
          type: 'Identifier',
          name: 'sinon',
        },
      },
    })
    .forEach((nodepath) => {
      // uage:
      debug(np)
    })
}
```

Will log:
```
Node tree is:
{
  "type": "CallExpression",
  "callee": {
      "type": "MemberExpression",
      "object": {
          "type": "Identifier",
          "name": "sinon"
      },
      "property": {
          "type": "Identifier",
          "name": "stub"
      }
  },
  "arguments": [
      {
          "type": "Identifier",
          "name": "I18n"
      },
      {
          "type": "Literal",
          "value": "extend"
      }
  ]
} 
    
Node to source:
    
sinon.stub(I18n, 'extend');
```