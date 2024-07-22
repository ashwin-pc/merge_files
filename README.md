# File Combination Tool

## Overview

The File Combination Tool is a Node.js script that combines multiple files from a specified directory (and its subdirectories) or a GitHub repository folder into a single output file. It supports various programming languages and file types, providing options to include or exclude specific files or directories, remove header comments, and output statistics about the largest files and folders processed.

## Features

- Combine multiple files into a single output file
- Support for both local directories and GitHub repositories
- Process specific files/folders or all files in the base directory/repository
- Exclude files/folders based on patterns
- Remove specified header patterns from files
- Output statistics on the 20 largest files processed
- Output statistics on the 10 largest root-level folders processed
- Estimate the total number of tokens in the combined output
- Colorized console output for improved readability

## Installation

You can use this tool without installation via npx, or you can install it globally on your system.

### Using npx (recommended)

No installation required. Simply run the tool using npx:

```
npx file-combination-tool [options]
```

### Global Installation

To install the tool globally, run:

```
npm install -g file-combination-tool
```

Then you can use it from anywhere:

```
file-combination-tool [options]
```

### Local Installation

If you want to clone the repository and run it locally:

1. Clone the repository:
   ```
   git clone https://github.com/your-username/file-combination-tool.git
   cd file-combination-tool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the tool:
   ```
   node cli.js [options]
   ```

## Usage

### Local Directory

To combine all supported files in the current directory:

```
npx file-combination-tool
```

This will create a file named `combined_[current-directory-name].txt` in the current directory.

### GitHub Repository

To combine files from a GitHub repository:

```
npx file-combination-tool --githubUrl https://github.com/username/repo/tree/branch/path/to/folder --githubToken YOUR_GITHUB_TOKEN
```

Replace `YOUR_GITHUB_TOKEN` with a valid GitHub Personal Access Token.

> The token is optional, but you do run the risk of running into rate limits without it.

### Command-line Arguments

```
npx file-combination-tool [options]
```

Options (all are optional):
- `--baseDir`, `-b`: Base directory to process files from (default: current directory)
- `--githubUrl`, `-g`: GitHub URL to process files from
- `--githubToken`, `-t`: GitHub Personal Access Token for authentication
- `--include`, `-i`: Files or folders to include (comma-separated)
- `--exclude`, `-e`: Patterns to exclude (comma-separated, default: 'node_modules/,venv/,.git/')
- `--extensions`, `-x`: File extensions to process (comma-separated, default: .js,.ts,.jsx,.tsx,.py,.rb,.java,.c,.cpp,.cs,.php,.go,.rs,.swift,.kt,.md)
- `--output`, `-o`: Output file name (default: combined_[baseDir-name].txt)
- `--config`, `-c`: Path to config file (if using a config file instead of command-line args)

Examples:

1. Combine Python files:
   ```
   npx file-combination-tool --extensions .py
   ```

2. Combine Java and Kotlin files:
   ```
   npx file-combination-tool --extensions .java,.kt
   ```

3. Exclude additional patterns:
   ```
   npx file-combination-tool --exclude "test/,*.spec.js"
   ```

4. Specify output file:
   ```
   npx file-combination-tool --output combined-project.txt
   ```

5. Combine files from a different directory:
   ```
   npx file-combination-tool --baseDir ../another-project
   ```

### Config File

For more complex scenarios, you can use a config file:

```
npx file-combination-tool --config path/to/your/config.json
```

Config file structure:

```json
{
  "baseDir": "/path/to/your/base/directory",
  "githubUrl": "https://github.com/username/repo/tree/branch/path/to/folder",
  "githubToken": "YOUR_GITHUB_TOKEN",
  "include": ["folder1", "folder2/file.py"],
  "exclude": ["test/", "*.spec.py"],
  "extensions": [".py", ".pyx"],
  "output": "combined_output.txt",
  "headerPatterns": [
    "#.*",
    "'''[\\s\\S]*?'''",
    '"""[\\s\\S]*?"""'
  ]
}
```

## Supported Languages

The tool supports the following file extensions by default:
.js, .ts, .jsx, .tsx, .py, .rb, .java, .c, .cpp, .cs, .php, .go, .rs, .swift, .kt, .md

You can specify additional file extensions using the `--extensions` option or in the config file.

## Output

The script will generate:

1. A combined file containing the content of all processed files.
2. Colorized console output showing:
   - Progress of file processing
   - The 20 largest files processed (by size)
   - The 10 largest root-level folders processed
   - The estimated total number of tokens in the combined output

## Limitations

- The token counting is a simple estimate and may not match exactly with more sophisticated tokenization methods.
- Header removal patterns are predefined for common languages. For other languages, you may need to specify custom patterns.
- When using the GitHub functionality, be aware of API rate limits, especially for large repositories.

## Contributing

Contributions to improve the tool are welcome. Please feel free to submit issues or pull requests on the project's repository.

## License

MIT License