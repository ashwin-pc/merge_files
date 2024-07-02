const path = require("path");
const { readConfigFile } = require("./config");
const { combineFiles } = require("./fileProcessor");

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Please provide the path to the configuration file.");
    process.exit(1);
  }

  const configPath = args[0];
  const config = await readConfigFile(configPath);

  const baseDir = path.resolve(config.baseDir || ".");
  const includePaths = config.include || [];
  const skipPatterns = config.exclude || [];
  const outputPath =
    config.output ||
    path.join(process.cwd(), `combined_${path.basename(baseDir)}.txt`);
  const headerPatterns = config.headerPatterns || [
    "/\\*[\\s\\S]*?Copyright[\\s\\S]*?\\*/",
    "/\\*\\s*\\*\\s*Licensed[\\s\\S]*?under the License\\.\\s*\\*/",
  ];

  await combineFiles(
    baseDir,
    includePaths,
    outputPath,
    skipPatterns,
    headerPatterns
  );
}

main().catch(console.error);
