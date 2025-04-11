# Roo Code extension patcher for Termux

This repository contains a Node.js script which patches Roo Code extension to work on VS Code in Termux (proot-distro).

[The issue.](https://github.com/RooVetGit/Roo-Code/issues/2345#issue-2974902390)
[The cause of issue.](https://github.com/RooVetGit/Roo-Code/issues/2345#issuecomment-2794593138)

### Patcher usage

Create a directory, cd into it and copy Roo Code .vsix extension to it:

```bash
mkdir roocode-patch && cd roocode-patch
cp <path to ext>/<ext>.vsix ./
```

Download a patcher script:

```bash
curl -sO https://raw.githubusercontent.com/BlueGradientHorizon/roo-code-termux-patcher/refs/heads/main/patcher.js && curl -sO https://raw.githubusercontent.com/BlueGradientHorizon/roo-code-termux-patcher/refs/heads/main/package.json && chmod u+x ./patcher.js 
```

The script works on Node.js 23.11.0, work on other versions is unknown:

```bash
nvm install 23 && nvm use 23
```

Install dependencies:

```bash
npm i .
```

Run patcher:

```bash
./patcher.js
```

You'll get a `<ext>-patched.vsix` extension.
