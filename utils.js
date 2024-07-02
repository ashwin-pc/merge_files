const fs = require("fs").promises;

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function shouldSkipFile(filePath, skipPatterns) {
  return skipPatterns.some(pattern => new RegExp(pattern).test(filePath));
}

function removeHeaders(content, headerPatterns) {
  return headerPatterns.reduce(
    (acc, pattern) => acc.replace(new RegExp(pattern, 'g'), ""),
    content
  );
}

function countTokens(text) {
  const tokens = text.split(/\s+|[.,!?;:()[\]{}'"]/);
  return tokens.filter(token => token.length > 0).length * 2;
}

module.exports = {
  fileExists,
  shouldSkipFile,
  removeHeaders,
  countTokens
};
