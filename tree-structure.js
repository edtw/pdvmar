// tree-structure.js
const fs = require('fs');
const path = require('path');

const IGNORE = ['node_modules', '.git', '.DS_Store'];

function generateTree(dir, prefix = '') {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return '';
  }

  const filtered = entries
    .filter(e => !IGNORE.includes(e.name) && !e.name.startsWith('.'));
  const lastIndex = filtered.length - 1;

  return filtered.map((entry, index) => {
    const isLast = index === lastIndex;
    const pointer = isLast ? '└── ' : '├── ';
    const fullPath = path.join(dir, entry.name);
    const line = prefix + pointer + entry.name;

    if (entry.isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      return line + '\n' + generateTree(fullPath, nextPrefix);
    } else {
      return line;
    }
  }).join('\n');
}

const startPath = path.resolve(process.argv[2] || '.');
console.log(path.basename(startPath) + '/');
const treeOutput = generateTree(startPath);
console.log(treeOutput || '(vazio)');
