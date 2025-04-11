const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const rimrafSync = require('rimraf');
const acorn = require('acorn');
const acornWalk = require('acorn-walk');

function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

function findVSIXFile() {
  const files = fs.readdirSync('.');
  const vsixFile = files.find(file => file.endsWith('.vsix'));
  if (!vsixFile) {
    throw new Error('No .vsix file found in the current directory.');
  }
  return vsixFile;
}

function unpackVSIX(vsixFile) {
  const tempDir = `.temp-${generateRandomString()}`;
  fs.mkdirSync(tempDir);

  const zip = new AdmZip(vsixFile);
  zip.extractAllTo(tempDir, true);

  console.log(`Unpacked ${vsixFile} into ${tempDir}`);
  return tempDir;
}

function patchExtensionJS(tempDir) {
  const filePath = path.join(tempDir, 'extension', 'dist', 'extension.js');
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const ast = acorn.parse(fileContent, { ecmaVersion: 'latest' });

  let targetFunctionName = null;

  acornWalk.simple(ast, {
    FunctionDeclaration(node) {
      const callsNetworkInterfaces = node.body.body.some(stmt =>
        stmt.type === 'VariableDeclaration' &&
        stmt.declarations.some(decl =>
          decl.init &&
          decl.init.callee &&
          decl.init.callee.property &&
          decl.init.callee.property.name === 'networkInterfaces'
        )
      );

      var accessesFamily = false;
      try {
        accessesFamily = node.body.body[1].argument.expressions[0].right.right.property.name === "family";
      } catch { }

      if (callsNetworkInterfaces && accessesFamily) {
        targetFunctionName = node.id.name;
      }
    }
  });

  if (!targetFunctionName) {
    throw new Error('Target function not found.');
  }

  const patchedContent = fileContent.replace(
    new RegExp(`function ${targetFunctionName}\\(\\)\\{(.+?)\\}`, 's'),
    `function ${targetFunctionName}(){try{$1}catch{return "IPv4";}}`
  );

  fs.writeFileSync(filePath, patchedContent, 'utf8');
  console.log(`Patched function "${targetFunctionName}" successfully.`);
}

function repackVSIX(tempDir, originalVsixName) {
  const patchedVsixName = `${originalVsixName.replace('.vsix', '')}-patched.vsix`;
  const zip = new AdmZip();

  zip.addLocalFolder(tempDir);
  zip.writeZip(patchedVsixName);
  console.log(`Repacked into ${patchedVsixName}`);
}

function deleteTempDirectory(tempDir) {
  rimrafSync(tempDir, {});
  console.log(`Cleaned up temporary directory: ${tempDir}`);
}

function main() {
  try {
    const vsixFile = findVSIXFile();
    const tempDir = unpackVSIX(vsixFile);

    try {
      patchExtensionJS(tempDir);
    } catch (error) {
      deleteTempDirectory(tempDir);
      throw error;
    }

    repackVSIX(tempDir, vsixFile);
    deleteTempDirectory(tempDir);
  } catch (error) {
    console.error(error);
  }
}

main();
