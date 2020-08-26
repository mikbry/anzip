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

const fsp = fs.promises;
const pipeline = util.promisify(stream.pipeline);
// const finished = util.promisify(stream.finished);
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
    if (
      !rules.some((p) => {
        if (p.pattern.test(this.filename)) {
          this.parameters = { ..._parameters, ...p };
          return true;
        }
        return false;
      })
    ) {
      this.parameters = { ..._parameters };
    }
    return this.parameters;
  }

  async init(_parameters, rules) {
    const parameters = this.buildParameters(_parameters, rules);
    const openReadStream = util.promisify(this.zipFile.openReadStream.bind(this.zipFile));
    this.stream = await openReadStream(this.entry);
    if (this.filename && parameters.outputContent) {
      this.chunks = [];
      this.stream.on('data', (chunk) => {
        this.chunks.push(chunk);
      });
    }
    return parameters;
  }

  async close(shouldDrain) {
    if (this.stream) {
      this.stream.unpipe();
    }
    if (shouldDrain) {
      this.zipFile.readEntry();
    }
  }

  cleanup() {
    if (this.chunks) {
      this.content = Buffer.concat(this.chunks);
    }
    this.zipFile.readEntry();
    this.stream = null;
  }

  async getContent() {
    if (this.parameters.outputContent && !this.content && !this.saved && this.stream) {
      await new Promise((resolve) =>
        this.stream.on('end', () => {
          resolve();
        }),
      );
      this.cleanup();
    }
    return this.content;
  }

  async saveTo(outputPath, flattenPath = this.parameters.flattenPath) {
    let { filename } = this;
    try {
      if (!flattenPath && this.directory) {
        filename = path.join(this.directory, filename);
      }
      const f = path.join(outputPath, filename);
      const ws = fs.createWriteStream(f);
      await pipeline(this.stream, ws);
      this.cleanup();
      this.saved = true;
    } catch (err) {
      /* istanbul ignore next */
      // eslint-disable-next-line no-param-reassign
      this.error = err;
    }
    return this.saved;
  }

  async proceed(opts, output) {
    const {
      pattern,
      disableSave,
      outputContent,
      entryHandler,
      outputPath,
      flattenPath,
      disableOutput,
    } = this.parameters;
    const { filename: name, directory } = this;
    let shouldDrain = true;
    if (!name && directory && !flattenPath && outputPath) {
      await fsp.mkdir(path.join(outputPath, directory), { recursive: true });
    } else if (this.filename) {
      const data = { name };
      if (directory) {
        data.directory = directory;
      }
      if (!pattern || pattern.test(name)) {
        if (!disableOutput || outputContent) {
          output.files.push(data);
        }
        if (!entryHandler || (await entryHandler(this, data, opts))) {
          if (!disableSave && outputPath) {
            // saveTo
            await this.saveTo(outputPath, flattenPath);
          }
        }
        data.saved = this.saved;
        const content = await this.getContent();
        if (content) {
          data.content = content;
        }
        shouldDrain = !(data.content || data.saved);
      }
    }
    return this.close(shouldDrain);
  }
}
