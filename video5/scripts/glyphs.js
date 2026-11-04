// 收集 src 里出现的所有非 ASCII 字符，写进 src/glyphs.ts，渲染前预加载对应的字体分片。
const fs = require('fs');
const path = require('path');
const set = new Set();
const walk = (d) => {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|json)$/.test(n) && !n.startsWith('glyphs')) for (const ch of fs.readFileSync(p, 'utf8')) if (ch.charCodeAt(0) > 127) set.add(ch);
  }
};
walk(path.join(__dirname, '..', 'src'));
const s = [...set].sort().join('') + '0123456789.%·×−+:/,';
fs.writeFileSync(path.join(__dirname, '..', 'src', 'glyphs.ts'), `export const GLYPHS = ${JSON.stringify(s)};\n`);
console.log('glyphs:', set.size);
