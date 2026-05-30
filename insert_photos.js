const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');
const arrayStr = fs.readFileSync('photos_array.txt', 'utf8');
const newContent = content.replace(/const repostPhotos = \[\s*\{ file:[\s\S]*?\];/m, `const repostPhotos = [\n${arrayStr}\n];`);
fs.writeFileSync('server.js', newContent, 'utf8');
