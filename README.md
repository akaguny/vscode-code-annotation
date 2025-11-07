<div align="center">
  <img src="resources/code-annotation.png" alt="Code Annotation Logo" height="100"> <h1>Code Annotation</h1>
</div>

Create and track annotations from your source code without actually committing comments on your code.

![](https://github.com/thamara/vscode-code-annotation/blob/main/demo/Code%20Annotation.png)

The "Code Annotation" can be found in the Activity pane.

## Features

- Create an annotation from the source code, selecting the portion of code, right-clicking and adding a note
- Keybinds for creating a new note from selection (`Ctrl/Cmd + alt + n)`, or without selection, aka Plain note (`Ctrl/Cmd + alt + p`)
- Track annotations on its own pane
- Check/Uncheck items as you complete them
- Generate a report in Markdown with a summary of the pending and completed items
- Copy notes summary to clipboard for quick sharing

# Feedback and feature requests

Feel free to open [issues](https://github.com/thamara/vscode-code-annotation/issues) and suggest [new features](https://github.com/thamara/vscode-code-annotation/projects/1) for the extension.


# Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=tkcandrade.code-annotation).

## Using a VSIX file
Download the [VSIX file](https://github.com/thamara/vscode-code-annotation/blob/master/code-annotation.vsix) and follow the steps on your VSCode:

1. Go to the "Extensions" pane
2. Click on the ... on the top right of the "Extensions" pane
3. Select "Install from VSIX"
4. Select the VSIX file you downloaded and click install

# Development

- For the development you'll need to use VSCode
- Install Node.js 24 LTS and npm
- After forking/cloning the repository, run:
```
npm install
npm run compile
```
- And to run/test the extension, go the the Run pane and hit the green button on `Run Extension`. This will open a new VSCode window with the extension enabled.

## Using mise for Development

This project supports [mise](https://mise.jdx.dev/) for managing development tools and tasks. If you have mise installed:

```bash
# Install dependencies
mise run install

# Build the project
mise run build

# Run linter
mise run lint

# Run tests
mise run test

# Watch for changes during development
mise run watch

# Create VSIX package
mise run package
```

The `mise.toml` configuration manages Node.js version and defines common development tasks.

## Docker-based development

A Docker environment is available for working on the extension without installing Node.js locally. The container uses the latest Node.js LTS release and mirrors the CI configuration.

```bash
# Start a watch task with automatic dependency installation
docker compose up

# Run the automated test suite inside Docker
docker compose run --rm dev npm test

# Run a one-off compile or lint step
docker compose run --rm dev npm run compile
```

Use `Ctrl+C` to stop the watch task when you are done. The `dev` service mounts your working directory, so any changes made on the host are instantly available inside the container.

## Creating a VSIX file for instalation

- "Compile" the extension as usual
  - `npm install`
- Install vsce
  - `npm install -g vsce`
- Create the VSIX file
  - `vsce package`
