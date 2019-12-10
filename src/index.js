/**
 * Copyright (c) Mik BRY
 * mik@miklabs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';
import util from 'util';
import yauzl from 'yauzl';
import ZipEntry from './ZipEntry';

const fsp = fs.promises;
const zipOpen = util.promisify(yauzl.open);

const proceed = async (
  entry,
  { pattern, disableSave, outputContent, entryHandler, outputPath, flattenPath, disableOutput },
  opts,
  output,
) => {
  const { filename: name, directory } = entry;
  if (!name && directory && !flattenPath && outputPath) {
    await fsp.mkdir(path.join(outputPath, directory), { recursive: true });
  } else if (entry.filename) {
    const data = { name };
    if (directory) {
      data.directory = directory;
    }
    if (!pattern || pattern.test(name)) {
      if (!disableOutput || outputContent) {
        output.files.push(data);
      }
      if (!entryHandler || (await entryHandler(entry, data, opts))) {
        if (!disableSave && outputPath) {
          // saveTo
          await entry.saveTo(outputPath, flattenPath);
          data.saved = true;
        } else if (outputContent) {
          await entry.getContent();
        }
      }
      if (entry.content) {
        data.content = entry.content;
      }
      data.saved = entry.saved;
      if (data.content || data.saved) {
        return entry.close();
      }
    }
  }
  // autodrain
  return entry.drain();
};

const anzip = async (
  filename,
  {
    pattern,
    disableSave = false,
    outputContent = false,
    entryHandler,
    outputPath = disableSave || outputContent || entryHandler ? undefined : './',
    flattenPath = false,
    disableOutput = false,
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
      const parameters = await entry.init(
        { pattern, disableSave, outputContent, entryHandler, outputPath, flattenPath, disableOutput },
        rules,
      );
      await proceed(entry, parameters, opts, output);
    });
    zipFile.on('end', () => {
      const hr = process.hrtime(hrstart);
      output.duration = hr[0] + hr[1] / 100000000;
      resolve(output);
    });
    /* istanbul ignore next */
    zipFile.on('error', err => {
      reject(err);
    });
  });
};

export default anzip;
