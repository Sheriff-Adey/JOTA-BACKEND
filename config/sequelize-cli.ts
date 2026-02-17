const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const modulesPath = path.join(__dirname, '..', 'src', 'modules');

const entityFiles = [];

// Recursively search for .entity.ts files in all module folders
const findEntityFiles = dir => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findEntityFiles(filePath);
    } else if (file.endsWith('.entity.ts')) {
      entityFiles.push(filePath);
    }
  });
};

findEntityFiles(modulesPath);

entityFiles.forEach(entityFile => {

  const entityName = path.basename(entityFile, '.entity.ts');
  const entityPath = path.join(modulesPath,entityName,`${entityName}.entity.ts`)
  console.log(entityPath)
  execSync(`npx sequelize-cli migration:generate --name create-${entityName} --models-path "${entityPath}" --migrations-path ../migrations`);
});
