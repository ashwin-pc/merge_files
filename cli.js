#!/usr/bin/env node

const path = require("path");
const fs = require("fs").promises;
const os = require("os");
const { readConfigFile } = require("./config");
const { combineFiles } = require("./fileProcessor");
const yargs = require("yargs");

const defaultExtensions = [".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".java", ".c", ".cpp", ".cs", ".php", ".go", ".rs", ".swift", ".kt", ".md"];

const defaultLicenseHeaders = [
    // Pattern to match one or more consecutive license headers
    /^(\/\*[\s\S]*?(\*\/|(?:license|copyright|spdx|contrib|opensearch|elasticsearch)[\s\S]*?\*\/)[\s\*]*)+/gi
];

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

async function main() {
    const argv = yargs
        .option('baseDir', {
            alias: 'b',
            describe: 'Base directory to process files from',
            type: 'string',
            default: process.cwd()
        })
        .option('include', {
            alias: 'i',
            describe: 'Files or folders to include (comma-separated)',
            type: 'string'
        })
        .option('exclude', {
            alias: 'e',
            describe: 'Patterns to exclude (comma-separated)',
            type: 'string',
            default: 'node_modules/,venv/,.git/'
        })
        .option('extensions', {
            alias: 'x',
            describe: 'File extensions to process (comma-separated)',
            type: 'string',
            default: defaultExtensions.join(',')
        })
        .option('output', {
            alias: 'o',
            describe: 'Output file name',
            type: 'string'
        })
        .option('config', {
            alias: 'c',
            describe: 'Path to config file',
            type: 'string'
        })
        .help()
        .argv;

    let config;

    if (argv.config) {
        config = await readConfigFile(argv.config);
    } else {
        config = {
            baseDir: argv.baseDir,
            include: argv.include ? argv.include.split(',') : [],
            exclude: argv.exclude ? argv.exclude.split(',') : ['node_modules/', 'venv/', '.git/'],
            extensions: argv.extensions ? argv.extensions.split(',') : defaultExtensions,
            output: argv.output || `combined_${path.basename(argv.baseDir)}.txt`,
            licenseHeaders: defaultLicenseHeaders
        };
    }

    const baseDir = path.resolve(config.baseDir);
    const includePaths = config.include || [];
    const skipPatterns = config.exclude || [];
    const extensions = config.extensions || defaultExtensions;
    const outputPath = config.output ? path.resolve(config.output) : path.join(process.cwd(), `combined_${path.basename(baseDir)}.txt`);
    const licenseHeaders = config.licenseHeaders || defaultLicenseHeaders;

    await combineFiles(
        baseDir,
        includePaths,
        outputPath,
        skipPatterns,
        licenseHeaders,
        extensions
    );

    // Output command to open the folder containing the output file
    const command = getOpenFolderCommand(outputPath);
    const colorizedCommand = colorizeCommand(command, colors.green);
    console.log(`\nTo open the folder containing the output file, run the following command:`);
    console.log(colorizedCommand);
}

main().catch(console.error);