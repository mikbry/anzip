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
import yauzl from 'yauzl';
import ZipEntry from './ZipEntry';

const fsp = fs.promises;
const pipeline = util.promisify(stream.pipeline);
const zipOpen = util.promisify(yauzl.open);

const saveTo = async (entry, outputPath, flattenPath) => {
  let { filename } = entry;
  try {
    if (!flattenPath && entry.directory) {
      filename = path.join(entry.directory, filename);
    }
    const f = path.join(outputPath, filename);
    const ws = fs.createWriteStream(f, { flags: 'a' });
    await pipeline(entry.stream, ws);
  } catch (err) {
    // eslint-disable-next-line no-param-reassign
    entry.error = err;
  }
};

const anzip = async (
  filename,
  {
    pattern,
    disableSave,
    outputContent,
    outputPath = disableSave || outputContent ? undefined : './',
    flattenPath,
    entryHandler,
    rules,
    ...opts
  } = {},
) => {
  const hrstart = process.hrtime();
  const output = { files: [] };
  const zipFile = await zipOpen(filename, { lazyEntries: true });
  return new Promise((resolve, reject) => {
    zipFile.readEntry();
    zipFile.on('entry', async e => {
      const entry = new ZipEntry(zipFile, e);
      const { filename: name, directory } = entry;
      await entry.init(outputContent);
      if (!name && directory && !flattenPath && outputPath) {
        await fsp.mkdir(path.join(outputPath, directory), { recursive: true });
      } else if (entry.filename) {
        const data = { name };
        if (directory) {
          data.directory = directory;
        }
        if (!pattern || pattern.test(name)) {
          output.files.push(data);
          if (!entryHandler || (await entryHandler(entry, data, opts))) {
            if (!disableSave && outputPath) {
              // saveTo
              await saveTo(entry, outputPath, flattenPath);
              data.saved = true;
            } else if (outputContent) {
              await entry.getContent();
            }
            if (entry.content) {
              data.content = entry.content;
            }
          }
          return entry.close();
        }
      }
      // autodrain
      return entry.drain();
    });
    zipFile.on('end', () => {
      const hr = process.hrtime(hrstart);
      output.duration = hr[0] + hr[1] / 100000000;
      resolve(output);
    });
    zipFile.on('error', err => {
      reject(err);
    });
  });
};

export default anzip;
