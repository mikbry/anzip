/**
 * Copyright (c) Mik BRY
 * mik@miklabs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import util from 'util';
import yauzl from 'yauzl';
import ZipEntry from './ZipEntry';

const zipOpen = util.promisify(yauzl.open);

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
    const func = async (e) => {
      const entry = new ZipEntry(zipFile, e);
      await entry.init(
        { pattern, disableSave, outputContent, entryHandler, outputPath, flattenPath, disableOutput },
        rules,
      );
      return entry.proceed(opts, output);
    };
    zipFile.on('entry', (e) => func(e).then());
    zipFile.on('end', () => {
      const hr = process.hrtime(hrstart);
      output.duration = hr[0] + hr[1] / 100000000;
      resolve(output);
    });
    /* istanbul ignore next */
    zipFile.on('error', (err) => {
      reject(err);
    });
  });
};

export default anzip;
