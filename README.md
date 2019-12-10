# anzip
Node nice Async unzip library

[![Build Status](https://travis-ci.com/mikbry/anzip.svg?token=mRB1zwsyoRAKcamR2qpU&branch=master)](https://travis-ci.com/mikbry/anzip) [![codecov](https://codecov.io/gh/mikbry/anzip/branch/master/graph/badge.svg?token=K4P0vnM5fh)](https://codecov.io/gh/mikbry/anzip)



- Simple to use
- Modern ES6 syntax (import instead of require, await/async, ...)
- Unzip using [Yauzl](https://github.com/thejoshwolfe/yauzl/)
- Follows [Node best practices](https://github.com/goldbergyoni/nodebestpractices)

### Requirements
- Node >= 10

### Usage

```
import anzip from 'anzip';

// Extract file.zip to current path
await anzip('file.zip');

// Extract file.zip to the current path and get output
const output = await anzip('file.zip');
console.log('duration=', output.duration);
console.log('number of files=', output.files.length);

// Extract only README.md from file.zip to current path
const output = await anzip('file.zip', { pattern: 'README.md', });
console.log('duration=', output.duration);
console.log('number of files=', output.files.length); // Should be one

// Extract only README.md from file.zip to output content variable
const output = await anzip('file.zip', { pattern: 'README.md', outputContent: true });
console.log('duration=', output.duration);
console.log('content=', output.files[0].content);

// Extract only README.md from file.zip to output content variable and currentpath
const output = await anzip('file.zip', { pattern: 'README.md', outputPath: './', outputContent: true });
console.log('duration=', output.duration);
console.log('content=', output.files[0].content);

```
