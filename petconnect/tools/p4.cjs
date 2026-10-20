const fs = require('fs');
const p = 'src/app/shared/presentation/components/header/header.component.ts';
let L = fs.readFileSync(p, 'utf8').split(/\r?\n/);
function must(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } }

const start = L.findIndex(l => l.trim() === '.header-search-results {');
must(start > -1, 'css start');
const end = L.findIndex((l, i) => i > start && l.trim() === '}');
must(end > -1, 'css end');

const css = [
  '    /* Panel de resultados: se renderiza dentro de p-popover (overlay en body). */',
  '    .header-search-results {',
  '      width: 380px;',
  '      max-width: min(380px, calc(100vw - 2rem));',
  '      max-height: 420px;',
  '      overflow-y: auto;',
  '      padding: 0.35rem;',
  '      background: var(--surface-card, #fff);',
  '      border: 1px solid var(--surface-border);',
  '      border-radius: var(--radius-md, 12px);',
  '      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);',
  '    }',
  '',
  '    /* El overlay vive en <body>: lo estilizamos vía ::ng-deep desde el host. */',
  '    :host ::ng-deep .header-search-popover.p-popover {',
  '      padding: 0;',
  '      background: transparent;',
  '      border: none;',
  '      box-shadow: none;',
  '    }',
  '',
  '    :host ::ng-deep .header-search-popover .p-popover-content {',
  '      padding: 0;',
  '    }',
];
L.splice(start, end - start + 1, ...css);
fs.writeFileSync(p, L.join('\n'));
console.log('CSS OK');
