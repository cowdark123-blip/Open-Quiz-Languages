const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'frontend', 'dist');
const destDir = path.join(__dirname, 'public');

// Recursively delete a directory
const deleteFolderRecursive = function (directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file, index) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
};

// Recursively copy a directory
const copyRecursiveSync = function(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

console.log('Cleaning public directory...');
deleteFolderRecursive(destDir);

console.log('Copying frontend/dist to public...');
if (fs.existsSync(sourceDir)) {
    copyRecursiveSync(sourceDir, destDir);
    console.log('Build output copied to public/ successfully!');
} else {
    console.error(`Source directory ${sourceDir} does not exist. Did the frontend build fail?`);
    process.exit(1);
}
