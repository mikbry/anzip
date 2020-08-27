# Anzip

[![Build Status][travis-image]][travis-url]
[![codecov][codecov-image]][codecov-url]
[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]

[travis-image]: https://travis-ci.com/mikbry/anzip.svg?token=mRB1zwsyoRAKcamR2qpU
[travis-url]: https://travis-ci.com/mikbry/anzip
[codecov-image]: https://codecov.io/gh/mikbry/anzip/branch/master/graph/badge.svg?token=K4P0vnM5fh
[codecov-url]: https://codecov.io/gh/mikbry/anzip
[npm-image]: https://img.shields.io/npm/v/anzip.svg
[npm-url]: https://npmjs.org/package/anzip
[license-image]: https://img.shields.io/npm/l/anzip.svg
[License-url]:./LICENSE

> Anzip is a library to unzip file archive for Node using only one async function.



### Purpose
- Simple to use
- Modern ES6+ syntax (import instead of require, await/async, ...)
- Unzip by [Yauzl](https://github.com/thejoshwolfe/yauzl/)
- Follows [Node best practices](https://github.com/goldbergyoni/nodebestpractices)

___

### Requirements
- Node >= 12

---

### Install
```bash
yarn add anzip
````

Or using npm
```bash
npm add anzip
````

---

### Usage
> Now that ESM support is widely common, `require` should be forgotten.

```javascript
import anzip from 'anzip';
```


> Extract file.zip to current path

```javascript
await anzip('file.zip');
```


> Extract file.zip to the current path and get output

```javascript
const output = await anzip('file.zip');
console.log('duration=', output.duration);
console.log('number of files=', output.files.length);
```

> Extract only README.md from file.zip to current path

```javascript
const output = await anzip('file.zip', { pattern: 'README.md', });
console.log('duration=', output.duration);
console.log('number of files=', output.files.length); // Should be one
```

> Extract only README.md from file.zip to output content variable

```javascript
const output = await anzip('file.zip', { pattern: 'README.md', outputContent: true });
console.log('duration=', output.duration);
console.log('content=', output.files[0].content);
```

> Extract only README.md from file.zip to output content variable and currentpath

```javascript
const output = await anzip('file.zip', { pattern: 'README.md', outputPath: './', outputContent: true });
console.log('duration=', output.duration);
console.log('content=', output.files[0].content);
```

> Extract with an entryHandler to fliter entry

```javascript
const outputPath = './path';
const entryHandler = async entry => {
  let resp = true;
  const fn = entry.name;
  if (fn.endsWith('dummy.pdf')) {
    try {
      await entry.saveTo(outputPath);
      resp = false;
    } catch (e) {
      //
    }
  }
  return resp;
};
const output = await anzip('file.zip',
    outputPath,
    { pattern: /(^(?!\.))(.+(.png|.jpeg|.jpg|.svg|.pdf|.json))$/i,, outputPath: './', entryHandler, outputContent: true });
console.log('duration=', output.duration);
// ./path/dummy.pdf should be saved
```

> Extract using 2 rules and an entryHandler in one to fliter entry

```javascript
const outputPath = './path';
const entryHandler = async entry => {
  let resp = true;
  const fn = entry.name;
  if (fn.endsWith('dummy.pdf')) {
    try {
      await entry.saveTo(outputPath);
      resp = false;
    } catch (e) {
      //
    }
  }
  return resp;
};
const output = await anzip('file.zip',
    outputPath,
    pattern: /(^(?!\.))(.+(.png|.jpeg|.jpg|.svg|.pdf|.json))$/i,
    flattenPath: true,
    disableSave: true,
    disableOutput: true,
    rules: [
      { pattern: /(^(?!\.))(test.json)$/i, outputContent: true },
      { pattern: /(^(?!\.))(.+(.png|.jpeg|.jpg|.svg|.pdf))$/i, entryHandler },
    ],
  });
console.log('duration=', output.duration);
// ./path/dummy.pdf should be saved
```


 ---

### Documentation
> One function to rule them all.

`output = await anzip(filename, {opts})`

**Function properties**

| parameters | type | description |
| ----------- | --- | ----------- |
| filename     | mandatory string | containing zip path to + file |
| opts            | optional object | containing optional parameters |
| opts.outputPath | optional string | the directory where to to save extracted files |
| opts.outputContent | optional boolean | if set to true, return file.content a Buffer containing file's content |
| opts.disableSave | optional boolean | if set to true, don't save files |
| opts.pattern | optional regex | if set only extract/proceed matching filenames |
| opts.flattenPath | optional boolean | if set don't recreate zip's directories, all file are saved in outputPath |
| opts.disableOutput | optional boolean | if set don't write files to output |
| opts.entryHandler | optional promise | use it to add some extra processing to an entry, return true if stream is consumed otherwise false |
| opts.rules | optional array | use it to add some fine tuned control how to handle each files |
| opts.rules.pattern | mandatory regex | if it match entry will use rule's parameters instead of global's one |


**Returned output is an object containing:**

| parameters | type | description |
| ----------- | --- | ----------- |
| duration | number | how long it took to extract in seconds |
| files | array | all files extracted or handled, otherwise empty |
| files[x].name | string | the filename |
| files[x].directory | string | the directory in archive (even if opts.flattenPath=true) |
| files[x].saved | boolean | true if the file was saved to outputPath |
| files[x].content | Buffer | the content of the file available if opts.outputContent=true or rule.outputContent=true |
| files[x].error | Error | if an error occured |

---
## Contribution

Read [Contributing Guide](CONTRIBUTING.md) for development setup instructions.
