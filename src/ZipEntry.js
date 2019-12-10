/**
 * Copyright (c) Mik BRY
 * mik@miklabs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';

const pipeline = util.promisify(stream.pipeline);
const finished = util.promisify(stream.finished);
export default class ZipEntry {
  constructor(zipFile, entry) {
    this.zipFile = zipFile;
    this.entry = entry;
    this.name = entry.fileName;
    if (/\/$/.test(entry.fileName)) {
      this.directory = entry.fileName.substring(0, entry.fileName.length - 1);
    } else {
      const i = entry.fileName.lastIndexOf('/');
      if (i > 0) {
        this.filename = entry.fileName.substring(i + 1);
        this.directory = entry.fileName.substring(0, i);
      } else {
        this.filename = entry.fileName;
      }
    }
    this.saved = false;
  }

  buildParameters(_parameters, rules = []) {
    let parameters;
    if (
      !rules.some(p => {
        if (p.pattern.test(this.filename)) {
          parameters = { ..._parameters, ...p };
          return true;
        }
        return false;
      })
    ) {
      parameters = { ..._parameters };
    }
    return parameters;
  }

  async init(_parameters, rules) {
    const parameters = this.buildParameters(_parameters, rules);
    const openReadStream = util.promisify(this.zipFile.openReadStream.bind(this.zipFile));
    this.stream = await openReadStream(this.entry);
    this.stream.on('end', () => {
      this.zipFile.readEntry();
      if (this.chunks) {
        this.content = Buffer.concat(this.chunks);
      }
    });
    if (this.filename && parameters.outputContent) {
      this.chunks = [];
      this.stream.on('data', chunk => {
        this.chunks.push(chunk);
      });
    }
    return parameters;
  }

  async drain() {
    this.stream.unpipe();
    this.zipFile.readEntry();
  }

  async close() {
    this.stream.unpipe();
  }

  async getContent() {
    return finished(this.stream);
  }

  async saveTo(outputPath, flattenPath) {
    let { filename } = this;
    try {
      if (!flattenPath && this.directory) {
        filename = path.join(this.directory, filename);
      }
      const f = path.join(outputPath, filename);
      const ws = fs.createWriteStream(f, { flags: 'a' });
      await pipeline(this.stream, ws);
      this.saved = true;
    } catch (err) {
      /* istanbul ignore next */
      // eslint-disable-next-line no-param-reassign
      this.error = err;
    }
  }
}
