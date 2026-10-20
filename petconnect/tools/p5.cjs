const fs = require('fs');
const p = 'src/app/shared/presentation/components/header/header.component.ts';
let L = fs.readFileSync(p, 'utf8').split(/\r?\n/);
const start = L.findIndex(l => l.includes('this.isSearchOpen.set(false);') && L[l+3] && L[l+3].includes('void this.router.navigateByUrl'));
// find start of that method
let s = start;
while (L[s].trim() !== 'onSelectResult(result: SearchResult): void {') s--;
let e = s;
while (L[e].trim() !== '}') e++;
L.splice(s, e - s + 2); // include following blank line
fs.writeFileSync(p, L.join('\n'));
console.log('DEDUP OK');
