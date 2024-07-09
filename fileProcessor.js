const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { fileExists, shouldSkipFile, removeHeaders, countTokens } = require("./utils");
const { outputLargestFiles, outputLargestFolders } = require("./outputFormatters");

// ANSI escape codes for coloring
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m"
};

function getOpenFolderCommand(relativeFilePath) {
  const folderPath = path.dirname(relativeFilePath);
  const platform = os.platform();

  let command;

  if (platform === 'win32') {
    // Windows
    command = `start ${folderPath}`;
  } else if (platform === 'darwin') {
    // macOS
    command = `open ${folderPath}`;
  } else {
    // Other (Linux and others)
    command = `xdg-open ${folderPath}`;
  }

  return command;
}

function colorizeCommand(command, color) {
  return `${color}${command}${colors.reset}`;
}

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

    // Output command to open the folder containing the output file using the cli without changing the current directory
    const command = getOpenFolderCommand(outputPath);
    const colorizedCommand = colorizeCommand(command, colors.green); // Using green color for the command
    console.log(`\nTo open the folder containing the output file, run the following command:`);
    console.log(colorizedCommand);
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
