const fs = require("fs").promises;

async function readConfigFile(configPath) {
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error("Error reading config file:", error.message);
    process.exit(1);
  }
}

module.exports = { readConfigFile };
