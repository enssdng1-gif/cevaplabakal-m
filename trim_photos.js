const fs = require('fs');
const path = require('path');

// 1. Orijinal dosyayı oku
const photosText = fs.readFileSync('photos_array.txt', 'utf8');

// Basitçe satırları parse et
const lines = photosText.split('\n').filter(l => l.trim() !== '');
const photos = lines.map(line => {
  const match = line.match(/file:\s*'([^']+)',\s*answer:\s*'([^']+)'/);
  if (match) {
    return { file: match[1], answer: match[2], originalLine: line };
  }
  return null;
}).filter(Boolean);

// 2. Grupla
const groups = {};
photos.forEach(p => {
  if (!groups[p.answer]) groups[p.answer] = [];
  groups[p.answer].push(p);
});

// 3. Eşit şekilde kıs, hedef = 90 fotoğraf (GitHub sınırı < 100)
let total = photos.length;
const target = 90;

while (total > target) {
  let maxGroup = null;
  let maxCount = -1;
  for (const key in groups) {
    if (groups[key].length > maxCount) {
      maxCount = groups[key].length;
      maxGroup = key;
    }
  }
  // En büyük gruptan 1 tane at (sondan atıyoruz)
  const removed = groups[maxGroup].pop();
  
  // Dosyayı sistemden de sil (eğer varsa)
  const filePath = path.join(__dirname, 'public', 'photos', removed.file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  total--;
}

// 4. Kalanları birleştir
const finalPhotos = [];
for (const key in groups) {
  finalPhotos.push(...groups[key]);
}

// 5. server.js dosyasını güncelle
let serverJs = fs.readFileSync('server.js', 'utf8');
const newArrayStr = finalPhotos.map(p => p.originalLine).join('\n');
const newServerJs = serverJs.replace(/const repostPhotos = \[\s*\{ file:[\s\S]*?\];/m, `const repostPhotos = [\n${newArrayStr}\n];`);

fs.writeFileSync('server.js', newServerJs, 'utf8');

console.log(`Fotoğraf sayısı ${photos.length}'ten ${finalPhotos.length}'e düşürüldü. Fazlalık dosyalar public/photos/ içinden silindi.`);
