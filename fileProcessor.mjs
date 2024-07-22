import fs from "fs/promises";
import path from "path";
import chalk from 'chalk';
import { fileExists, shouldSkipFile, removeLicenseHeaders, countTokens } from "./utils.mjs";
import { outputLargestFiles, outputLargestFolders } from "./outputFormatters.mjs";
import { processGitHubFolder } from "./githubProcessor.mjs";

async function combineFiles(baseDir, includePaths, outputPath, skipPatterns, licenseHeaderPatterns, extensions, isGitHub, githubToken) {
  try {
    let content = "";
    let fileSizes = [];
    let folderSizes = new Map();
    let processedFileCount = 0;

    const processPath = async (currentPath, isIncludePath = false) => {
      if (isGitHub) {
        const files = await processGitHubFolder(baseDir, skipPatterns, extensions, githubToken);
        for (const file of files) {
          const { fileContent, fileSize, tokenCount } = processGitHubFile(file, licenseHeaderPatterns);
          content += fileContent;
          fileSizes.push({ path: file.path, size: fileSize, tokens: tokenCount });
          updateFolderSizes(folderSizes, file.path, fileSize, tokenCount);
          processedFileCount++;
        }
      } else {
        const fullPath = path.join(baseDir, currentPath);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          const dirFiles = await getAllFiles(fullPath, baseDir, [], skipPatterns, extensions);
          for (const filePath of dirFiles) {
            const { fileContent, fileSize, tokenCount } = await processFile(baseDir, filePath, skipPatterns, licenseHeaderPatterns);
            content += fileContent;
            if (fileSize !== null) {
              fileSizes.push({ path: filePath, size: fileSize, tokens: tokenCount });
              updateFolderSizes(folderSizes, filePath, fileSize, tokenCount);
            }
          }
        } else if (isIncludePath || (!shouldSkipFile(currentPath, skipPatterns) && extensions.includes(path.extname(currentPath)))) {
          const { fileContent, fileSize, tokenCount } = await processFile(baseDir, currentPath, skipPatterns, licenseHeaderPatterns);
          content += fileContent;
          if (fileSize !== null) {
            fileSizes.push({ path: currentPath, size: fileSize, tokens: tokenCount });
            updateFolderSizes(folderSizes, currentPath, fileSize, tokenCount);
          }
        }
      }
    };

    console.log(chalk.blue("Starting file processing..."));

    if (includePaths.length > 0) {
      for (const includePath of includePaths) {
        await processPath(includePath, true);
      }
    } else {
      await processPath('');
    }

    await fs.writeFile(outputPath, content);
    console.log(chalk.green(`\nProcessed ${chalk.bold(processedFileCount)} files.`));
    console.log(chalk.green(`Combined content written to ${chalk.bold(outputPath)}`));

    console.log(chalk.blue("\nGenerating statistics..."));
    outputLargestFiles(fileSizes);
    outputLargestFolders(folderSizes);

    const totalTokenCount = fileSizes.reduce((sum, file) => sum + file.tokens, 0);
    console.log(chalk.cyan(`\nEstimated total number of tokens: ${chalk.bold(totalTokenCount)}`));
  } catch (error) {
    console.error(chalk.red("Error:"), error.message);
  }
}

function processGitHubFile(file, licenseHeaderPatterns) {
  let fileContent = removeLicenseHeaders(file.content, licenseHeaderPatterns);
  const tokenCount = countTokens(fileContent);
  fileContent = `\n//===== FILE: ${file.path} =====//\n\n${fileContent.trim()}\n`;
  return { fileContent, fileSize: file.size, tokenCount };
}

async function processFile(baseDir, filePath, skipPatterns, licenseHeaderPatterns) {
  const fullPath = path.join(baseDir, filePath);
  let fileContent = "";
  let fileSize = null;
  let tokenCount = 0;
  if (await fileExists(fullPath) && !shouldSkipFile(filePath, skipPatterns)) {
    fileContent = await fs.readFile(fullPath, "utf8");
    fileContent = removeLicenseHeaders(fileContent, licenseHeaderPatterns);
    tokenCount = countTokens(fileContent);
    fileContent = `\n//===== FILE: ${filePath} =====//\n\n${fileContent.trim()}\n`;

    const stats = await fs.stat(fullPath);
    fileSize = stats.size;
  } else {
    console.warn(`File skipped or not found: ${fullPath}`);
  }
  return { fileContent, fileSize, tokenCount };
}

async function getAllFiles(dir, baseDir, fileList = [], skipPatterns, extensions) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(baseDir, filePath);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      if (!shouldSkipFile(relativePath, skipPatterns)) {
        await getAllFiles(filePath, baseDir, fileList, skipPatterns, extensions);
      }
    } else if (
      extensions.includes(path.extname(file)) &&
      !shouldSkipFile(relativePath, skipPatterns)
    ) {
      fileList.push(relativePath);
    }
  }
  return fileList;
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

export { combineFiles };