#!/usr/bin/env node

import path from "path";
import os from "os";
import chalk from 'chalk';
import { readConfigFile } from "./config.mjs";
import { combineFiles } from "./fileProcessor.mjs";
import yargs from "yargs";
import { hideBin } from 'yargs/helpers';

const defaultExtensions = [".js", ".mjs", ".ts", ".jsx", ".tsx", ".py", ".rb", ".java", ".c", ".cpp", ".cs", ".php", ".go", ".rs", ".swift", ".kt", ".md"];

const defaultLicenseHeaders = [
    // Pattern to match one or more consecutive license headers
    /^(\/\*[\s\S]*?(\*\/|(?:license|copyright|spdx|contrib)[\s\S]*?\*\/)[\s\*]*)+/gi
];

function getOpenFolderCommand(relativeFilePath) {
    const folderPath = path.dirname(relativeFilePath);
    const platform = os.platform();

    if (platform === 'win32') {
        return `start ${folderPath}`;
    } else if (platform === 'darwin') {
        return `open ${folderPath}`;
    } else {
        return `xdg-open ${folderPath}`;
    }
}

const argv = yargs(hideBin(process.argv))
    .option('baseDir', {
        alias: 'b',
        describe: 'Base directory to process files from',
        type: 'string',
        default: process.cwd()
    })
    .option('githubUrl', {
        alias: 'g',
        describe: 'GitHub URL to process files from',
        type: 'string'
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
    .option('githubToken', {
        alias: 't',
        describe: 'GitHub Personal Access Token for authentication (can also be set via GITHUB_ACCESS_TOKEN environment variable)',
        type: 'string'
    })
    .help()
    .argv;

async function main() {
    let config;

    if (argv.config) {
        config = await readConfigFile(argv.config);
    } else {
        config = {
            baseDir: argv.baseDir,
            githubUrl: argv.githubUrl,
            include: argv.include ? argv.include.split(',') : [],
            exclude: argv.exclude ? argv.exclude.split(',') : ['node_modules/', 'venv/', '.git/'],
            extensions: argv.extensions ? argv.extensions.split(',') : defaultExtensions,
            output: argv.output || `combined_${path.basename(argv.baseDir)}.txt`,
            licenseHeaders: defaultLicenseHeaders
        };
    }

    const baseDir = config.githubUrl || path.resolve(config.baseDir);
    const includePaths = config.include || [];
    const skipPatterns = config.exclude || [];
    const extensions = config.extensions || defaultExtensions;
    const outputPath = config.output ? path.resolve(config.output) : path.join(process.cwd(), `combined_${path.basename(baseDir)}.txt`);
    const licenseHeaders = config.licenseHeaders || defaultLicenseHeaders;

    const githubToken = process.env.GITHUB_ACCESS_TOKEN || argv.githubToken;

    if (config.githubUrl && !githubToken) {
        console.warn(chalk.yellow("Warning: No GitHub token provided. API rate limits may apply."));
    }

    await combineFiles(
        baseDir,
        includePaths,
        outputPath,
        skipPatterns,
        licenseHeaders,
        extensions,
        !!config.githubUrl,
        githubToken
    );

    // Output command to open the folder containing the output file
    const command = getOpenFolderCommand(outputPath);
    console.log(chalk.cyan("\nTo open the folder containing the output file, run the following command:"));
    console.log(chalk.green(command));
}

main().catch(error => {
    console.error(chalk.red("Error:"), error.message);
    process.exit(1);
});