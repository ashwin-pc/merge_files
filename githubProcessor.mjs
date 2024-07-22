import { Octokit } from "@octokit/rest";
import path from "path";
import chalk from 'chalk';

let octokit;

function initializeOctokit(token) {
    octokit = new Octokit({
        auth: token,
        log: {
            debug: () => { },
            info: () => { },
            warn: console.warn,
            error: console.error
        }
    });
}

async function parseGitHubUrl(url) {
    const regex = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?(?:\/(.*))?/;
    const match = url.match(regex);
    if (!match) {
        throw new Error("Invalid GitHub URL");
    }

    const [, owner, repo, branch, path] = match;

    let resultBranch = branch;
    let resultPath = path || "";

    if (!branch) {
        // If no branch is specified, we need to fetch the default branch
        try {
            const { data: repoData } = await octokit.repos.get({ owner, repo });
            resultBranch = repoData.default_branch;
            console.log(chalk.blue(`No branch specified. Using default branch: ${chalk.bold(resultBranch)}`));
        } catch (error) {
            console.error(chalk.red("Error fetching repository information:"), error.message);
            throw error;
        }
    }

    return {
        owner,
        repo,
        branch: resultBranch,
        path: resultPath,
    };
}

async function getGitHubContents(owner, repo, path, branch) {
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        return data;
    } catch (error) {
        if (error.status === 404) {
            console.error(chalk.red("Repository, branch, or path not found. Please check the URL and ensure it's correct."));
        } else if (error.status === 403) {
            console.error(chalk.red("API rate limit exceeded or authentication required. Try using a GitHub token."));
        } else {
            console.error(chalk.red("Error fetching GitHub contents:"), error.message);
        }
        throw error;
    }
}

async function processGitHubFolder(url, skipPatterns, extensions, token) {
    if (!octokit) {
        initializeOctokit(token);
    }

    const { owner, repo, branch, path: repoPath } = await parseGitHubUrl(url);
    console.log(chalk.blue(`Processing GitHub repository: ${chalk.bold(owner)}/${chalk.bold(repo)}`));
    console.log(chalk.blue(`Branch: ${chalk.bold(branch)}, Path: ${chalk.bold(repoPath || 'root')}`));

    const contents = await getGitHubContents(owner, repo, repoPath, branch);

    const files = [];

    for (const item of Array.isArray(contents) ? contents : [contents]) {
        if (item.type === "file") {
            if (
                extensions.includes(path.extname(item.name)) &&
                !skipPatterns.some(pattern => new RegExp(pattern).test(item.path))
            ) {
                try {
                    process.stdout.write(chalk.yellow(`Fetching: ${item.path}\r`));
                    const fileContent = await octokit.request(item.download_url);
                    files.push({
                        path: item.path,
                        content: fileContent.data,
                        size: item.size,
                    });
                    process.stdout.write(chalk.green(`Fetched:  ${item.path}${' '.repeat(20)}\n`));
                } catch (error) {
                    console.error(chalk.red(`Error fetching file content for ${item.path}:`), error.message);
                }
            }
        } else if (item.type === "dir") {
            try {
                const subfolderFiles = await processGitHubFolder(
                    `https://github.com/${owner}/${repo}/tree/${branch}/${item.path}`,
                    skipPatterns,
                    extensions,
                    token
                );
                files.push(...subfolderFiles);
            } catch (error) {
                console.error(chalk.red(`Error processing subfolder ${item.path}:`), error.message);
            }
        }
    }

    return files;
}

export { processGitHubFolder };