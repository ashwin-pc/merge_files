# File Combination Tool

## Overview

The File Combination Tool is a Node.js script that combines multiple files from a specified directory (and its subdirectories) into a single output file. It provides options to include or exclude specific files or directories, remove header comments, and output statistics about the largest files and folders processed.

## Features

- Combine multiple files into a single output file
- Include specific files/folders or process all files in the base directory
- Exclude files/folders based on patterns
- Remove specified header patterns from files
- Output statistics on the 20 largest files processed
- Output statistics on the 10 largest root-level folders processed
- Estimate the total number of tokens in the combined output

## Installation

1. Ensure you have Node.js installed on your system (version 12 or higher recommended).
2. Clone this repository or download the source files.
3. Navigate to the project directory in your terminal.
4. Run `npm install` to install any dependencies (if applicable).

## Usage

Run the script using the following command:

```
node index.js path/to/your/config.json
```

Where `path/to/your/config.json` is the path to your configuration file.

## Configuration

Create a JSON configuration file with the following structure:

```json
{
  "baseDir": "/path/to/your/base/directory",
  "include": ["folder1", "folder2/file.js"],
  "exclude": ["\\.test\\.(js|ts|jsx|tsx)$", "\\.d\\.ts$", "fixtures/"],
  "output": "combined_output.txt",
  "headerPatterns": [
    "/\\*[\\s\\S]*?Copyright[\\s\\S]*?\\*/",
    "/\\*\\s*\\*\\s*Licensed[\\s\\S]*?under the License\\.\\s*\\*/"
  ]
}
```

### Configuration Options

- `baseDir` (required): The base directory to process files from.
- `include` (optional): An array of files or folders to include. If omitted, all files in the base directory will be processed.
- `exclude` (optional): An array of regex patterns for files or folders to exclude.
- `output` (optional): The name of the output file. Defaults to `combined_[baseDir].txt` in the current working directory.
- `headerPatterns` (optional): An array of regex patterns for headers to remove from the files.

## Output

The script will generate:

1. A combined file containing the content of all processed files.
2. Console output showing:
   - The 20 largest files processed (by size)
   - The 10 largest root-level folders processed
   - The estimated total number of tokens in the combined output

## Example

1. Create a configuration file named `config.json`:

```json
{
  "baseDir": "../OpenSearch-Dashboards/src/plugins",
  "include": ["data", "vis_builder"],
  "exclude": [
    "\\.test\\.(js|ts|jsx|tsx)$",
    "\\.d\\.ts$",
    "fixtures/",
    "mock",
    "api\\.md",
    "_generated_/"
  ],
  "output": "combined_plugins.txt",
  "headerPatterns": [
    "/\\*[\\s\\S]*?Copyright[\\s\\S]*?\\*/",
    "/\\*\\s*\\*\\s*Licensed[\\s\\S]*?under the License\\.\\s*\\*/"
  ]
}
```

2. Run the script:

```
node index.js config.json
```

This will process the specified plugins, combine their files (excluding test files, type definitions, fixtures, mocks, API docs, and generated files), remove the specified headers, and output the result to `combined_plugins.txt`.

## Limitations

- The tool currently only processes files with the following extensions: .js, .ts, .jsx, .tsx, and .md.
- The token counting is a simple estimate and may not match exactly with more sophisticated tokenization methods.

## Contributing

Contributions to improve the tool are welcome. Please feel free to submit issues or pull requests on the project's repository.

## License

MIT License
