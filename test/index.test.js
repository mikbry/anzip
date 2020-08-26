/**
 * Copyright (c) Mik BRY
 * mik@miklabs.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import { expect } from 'chai';
import anzip from '../src';

const fsp = fs.promises;
const TMP_PATH = './tmp_test';
describe('anzip', async () => {
  before(async () => {
    // Recursive is node >= 12
    await fsp.mkdir(TMP_PATH);
  });

  after(async () => {
    // Recursive is node >= 12
    // await fsp.rmdir(TMP_PATH, { recursive: true });
    rimraf.sync(TMP_PATH);
  });

  it('should extract an empty zip file', async () => {
    const output = await anzip('./test/data/empty.zip');
    // console.log('duration %ds', output.duration.toFixed(2));
    expect(typeof output.duration).to.equal('number');
    expect(output.files.length).to.equal(0);
  });

  it('should extract a simple zip file', async () => {
    const outputPath = path.join(TMP_PATH, 't1');
    await fsp.mkdir(outputPath);
    const output = await anzip('./test/data/simple.zip', { outputPath });
    expect(typeof output.duration).to.equal('number');
    expect(output.files.length).to.equal(2);
    expect(output.files[0].name).to.equal('README.md');
    const stat = await fsp.stat(path.join(outputPath, output.files[0].name));
    expect(stat.isFile()).to.equal(true);
  });

  it('should extract a simple zip file in content', async () => {
    const outputPath = path.join(TMP_PATH, 't2');
    await fsp.mkdir(outputPath);
    const output = await anzip('./test/data/simple.zip', { outputPath, outputContent: true });
    expect(typeof output.duration).to.equal('number');
    expect(output.files.length).to.equal(2);
    expect(output.files[0].name).to.equal('README.md');
    expect(output.files[0].content.toString()).to.equal('Hello World');
    expect(output.files[0].saved).to.equal(true);
    const stat = await fsp.stat(path.join(outputPath, output.files[0].name));
    expect(stat.isFile()).to.equal(true);
  });

  it('should extract a simple zip file in content without writing file', async () => {
    const output = await anzip('./test/data/simple.zip', { outputContent: true });
    expect(typeof output.duration).to.equal('number');
    expect(output.files.length).to.equal(2);
    expect(output.files[0].name).to.equal('README.md');
    expect(output.files[0].content.toString()).to.equal('Hello World');
    expect(output.files[0].saved).to.equal(false);
  });

  it('should extract a simple zip one file from pattern', async () => {
    const outputPath = path.join(TMP_PATH, 't3');
    await fsp.mkdir(outputPath);
    const output = await anzip('./test/data/simple.zip', { outputPath, pattern: /^README.md/ });
    expect(typeof output.duration).to.equal('number');
    expect(output.files.length).to.equal(1);
    expect(output.files[0].name).to.equal('README.md');
    expect(output.files[0].saved).to.equal(true);
    const stat = await fsp.stat(path.join(outputPath, output.files[0].name));
    expect(stat.isFile()).to.equal(true);
  });

  it('should extract a simple zip using an entryHandler', async () => {
    const outputPath = path.join(TMP_PATH, 't4');
    await fsp.mkdir(outputPath, { recursive: true });
    const entryHandler = async (entry) => {
      if (entry.filename === 'README.md') {
        await entry.saveTo(outputPath);
        return false;
      }
      return true;
    };
    const output = await anzip('./test/data/simple.zip', { entryHandler });
    expect(typeof output.duration).to.equal('number');
    expect(output.files.length).to.equal(2);
    expect(output.files[0].name).to.equal('README.md');
    expect(output.files[0].saved).to.equal(true);
    const stat = await fsp.stat(path.join(outputPath, output.files[0].name));
    expect(stat.isFile()).to.equal(true);
  });

  it('should extract a simple zip using rules', async () => {
    const outputPath = path.join(TMP_PATH, 't5');
    await fsp.mkdir(outputPath);
    const output = await anzip('./test/data/simple.zip', {
      outputPath,
      disableSave: true,
      disableOutput: true,
      rules: [{ pattern: /^README.md/, disableSave: false, disableOutput: false }],
    });
    expect(typeof output.duration).to.equal('number');
    expect(output.files.length).to.equal(1);
    expect(output.files[0].name).to.equal('README.md');
    expect(output.files[0].saved).to.equal(true);
    const stat = await fsp.stat(path.join(outputPath, output.files[0].name));
    expect(stat.isFile()).to.equal(true);
  });
});
