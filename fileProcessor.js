const fs = require("fs").promises;
const path = require("path");
const { fileExists, shouldSkipFile, removeHeaders, countTokens } = require("./utils");
const { outputLargestFiles, outputLargestFolders } = require("./outputFormatters");

async function combineFiles(baseDir, includePaths, outputPath, skipPatterns, headerPatterns) {
  try {
    let content = "";
    let fileSizes = [];
    let folderSizes = new Map();

    const processPath = async (currentPath, isIncludePath = false) => {
      const fullPath = path.join(baseDir, currentPath);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const dirFiles = await getAllFiles(fullPath, baseDir, [], skipPatterns);
        for (const filePath of dirFiles) {
          const { fileContent, fileSize, tokenCount } = await processFile(baseDir, filePath, skipPatterns, headerPatterns);
          content += fileContent;
          if (fileSize !== null) {
            fileSizes.push({ path: filePath, size: fileSize, tokens: tokenCount });
            updateFolderSizes(folderSizes, filePath, fileSize, tokenCount);
          }
        }
      } else if (isIncludePath || !shouldSkipFile(currentPath, skipPatterns)) {
        const { fileContent, fileSize, tokenCount } = await processFile(baseDir, currentPath, skipPatterns, headerPatterns);
        content += fileContent;
        if (fileSize !== null) {
          fileSizes.push({ path: currentPath, size: fileSize, tokens: tokenCount });
          updateFolderSizes(folderSizes, currentPath, fileSize, tokenCount);
        }
      }
    };

    if (includePaths.length > 0) {
      for (const includePath of includePaths) {
        await processPath(includePath, true);
      }
    } else {
      await processPath('');
    }

    await fs.writeFile(outputPath, content);
    console.log(`Combined files written to ${outputPath}`);
    
    outputLargestFiles(fileSizes);
    outputLargestFolders(folderSizes);

    const totalTokenCount = fileSizes.reduce((sum, file) => sum + file.tokens, 0);
    console.log(`\nEstimated total number of tokens: ${totalTokenCount}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function processFile(baseDir, filePath, skipPatterns, headerPatterns) {
  const fullPath = path.join(baseDir, filePath);
  let fileContent = "";
  let fileSize = null;
  let tokenCount = 0;
  if (await fileExists(fullPath) && !shouldSkipFile(filePath, skipPatterns)) {
    fileContent = await fs.readFile(fullPath, "utf8");
    fileContent = removeHeaders(fileContent, headerPatterns);
    tokenCount = countTokens(fileContent);
    fileContent = `\n//===== FILE: ${filePath} =====//\n\n${fileContent.trim()}\n`;
    
    const stats = await fs.stat(fullPath);
    fileSize = stats.size;
  } else {
    console.warn(`File skipped or not found: ${fullPath}`);
  }
  return { fileContent, fileSize, tokenCount };
}

function updateFolderSizes(folderSizes, filePath, fileSize, tokenCount) {
  const rootFolder = filePath.split(path.sep)[0];
  if (!folderSizes.has(rootFolder)) {
    folderSizes.set(rootFolder, { size: 0, tokens: 0 });
  }
  const folderStats = folderSizes.get(rootFolder);
  folderStats.size += fileSize;
  folderStats.tokens += tokenCount;
}

async function getAllFiles(dir, baseDir, fileList = [], skipPatterns) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(baseDir, filePath);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      if (!shouldSkipFile(relativePath, skipPatterns)) {
        await getAllFiles(filePath, baseDir, fileList, skipPatterns);
      }
    } else if (
      [".js", ".ts", ".jsx", ".tsx", ".md"].includes(path.extname(file)) &&
      !shouldSkipFile(relativePath, skipPatterns)
    ) {
      fileList.push(relativePath);
    }
  }
  return fileList;
}

module.exports = { combineFiles };
