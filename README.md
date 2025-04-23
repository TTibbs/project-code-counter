# Count-Lines

A simple command-line tool that counts lines of code in your project, excluding comments. It supports TypeScript, JavaScript, and Python files.

## Features

- Counts non-comment lines of code in your project
- Skips `node_modules` and hidden folders
- Works with TypeScript (.ts, .tsx), JavaScript (.js, .jsx), and Python (.py) files
- Interactive mode with easy language selection
- Command-line flags for quick counting

## Installation

```bash
npm install -g count-lines
```

## Usage

### Interactive Mode

Simply run the command without any flags to enter interactive mode:

```bash
count-lines
```

You'll be prompted to select which language you want to count or choose "All" to count all supported languages.

### Command-line Flags

You can also use command-line flags to specify which language to count:

```bash
count-lines --typescript    # Count only TypeScript files
count-lines --javascript    # Count only JavaScript files
count-lines --python        # Count only Python files
count-lines --all           # Count all supported languages
```

### How It Works

Count-Lines works by:

1. Scanning your project directory (excluding node_modules and hidden folders)
2. Identifying files with the selected extensions
3. Reading each file and removing comment lines:

- For JavaScript/TypeScript: Removes both /_ block comments _/ and // line comments
- For Python: Removes # line comments

4. Counting the remaining lines of code
5. Displaying a summary with files scanned and total lines count

## Contributing

We welcome contributions to Count-Lines! Here's how you can help:

### Setting Up for Development

1. Fork the repository on GitHub
2. Clone your fork to your local machine:

```bash
git clone https://github.com/TTibbs/project-line-counter
```

3. Install dependencies:

```bash
cd count-lines
npm install
```

### Making Changes

1. Create a new branch for your changes:

```bash
git checkout -b your-feature-branch
```

2. Make your changes to the code
3. Test your changes thoroughly
4. Commit your changes with a descriptive message:

```bash
git commit -m "Add support for new language"
```

### Submitting a Pull Request

1. Push your changes to your fork:

```bash
git push origin your-feature-branch
```

2. Go to the original repository on GitHub
3. Click "New Pull Request"
4. Select your fork and branch
5. Add a title and description explaining your changes
6. Submit the pull request

### Code Style

1. Use consistent indentation (2 spaces)
2. Follow TypeScript best practices
3. Add comments for complex logic
4. Update documentation for any new features

## License

MIT
