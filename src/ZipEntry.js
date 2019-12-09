/**
 * Copyright (c) Mik BRY
 * mik@miklabs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import stream from 'stream';
import util from 'util';

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
  }

  async init(outputContent) {
    const openReadStream = util.promisify(this.zipFile.openReadStream.bind(this.zipFile));
    this.stream = await openReadStream(this.entry);
    this.stream.on('end', () => {
      this.zipFile.readEntry();
      if (this.chunks) {
        this.content = Buffer.concat(this.chunks);
      }
    });
    if (this.filename && outputContent) {
      this.chunks = [];
      this.stream.on('data', chunk => {
        this.chunks.push(chunk);
      });
    }
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
}
