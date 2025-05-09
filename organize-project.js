// organize-project.js

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const baseDir = path.resolve(__dirname, 'marambaia-pdv');
const outputDir = path.resolve(__dirname, 'flat-upload');

const IGNORED_FOLDERS = ['node_modules', '.git', 'build', 'dist', 'coverage'];

const flatten = async (subDirName) => {
  const sourceDir = path.join(baseDir, subDirName);
  const targetDir = path.join(outputDir, subDirName);

  const allFiles = [];

  const walk = async (dir) => {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.promises.stat(fullPath);

      const isIgnored = IGNORED_FOLDERS.some(ignored =>
        fullPath.includes(path.sep + ignored + path.sep) ||
        fullPath.endsWith(path.sep + ignored)
      );
      if (isIgnored) continue;

      if (stat.isDirectory()) {
        await walk(fullPath);
      } else {
        allFiles.push(fullPath);
      }
    }
  };

  await walk(sourceDir);
  await fse.ensureDir(targetDir);

  for (const filePath of allFiles) {
    const relative = path.relative(sourceDir, filePath);
    const flatName = relative.replace(/[\/\\]/g, '__');
    const dest = path.join(targetDir, flatName);
    await fse.copy(filePath, dest);
  }
};

const main = async () => {
  await flatten('client');
  await flatten('server');
  console.log('✅ Projeto reorganizado em flat-upload/{client,server}, ignorando node_modules e pastas desnecessárias.');
};

main();
