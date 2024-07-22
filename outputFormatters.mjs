function outputLargestFiles(fileSizes) {
  console.log("\n20 Largest Files (by size):");
  fileSizes.sort((a, b) => b.size - a.size)
    .slice(0, 20)
    .forEach((file, index) => {
      console.log(`${index + 1}. ${file.path} (${formatFileSize(file.size)}, ${file.tokens} tokens)`);
    });
}

function outputLargestFolders(folderSizes) {
  console.log("\n10 Largest Root-Level Folders:");
  [...folderSizes.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10)
    .forEach((folder, index) => {
      console.log(`${index + 1}. ${folder[0]} (${formatFileSize(folder[1].size)}, ${folder[1].tokens} tokens)`);
    });
}

function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export {
  outputLargestFiles,
  outputLargestFolders,
  formatFileSize
};
