const fs = require('fs');
const folders = ['ceyda','efe','emre','enes','musa','naz','nergis','yağmur','yunus'];
let result = [];

folders.forEach(f => {
  const src = `c:\\Users\\user\\OneDrive\\Masaüstü\\pyc\\${f}`;
  if (fs.existsSync(src)) {
    fs.readdirSync(src).forEach(file => {
      result.push(`  { file: '${file}', answer: '${f}' }`);
    });
  }
});

fs.writeFileSync('c:\\Users\\user\\OneDrive\\Masaüstü\\pyc\\quiz-arena\\photos_array.txt', result.join(',\n'), 'utf-8');
