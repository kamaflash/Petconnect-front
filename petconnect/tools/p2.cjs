const fs = require('fs');
const p = 'src/app/shared/presentation/components/header/header.component.ts';
let L = fs.readFileSync(p, 'utf8').split(/\r?\n/);
function must(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } }

// import Popover
let i = L.findIndex(l => l.includes("import { RippleModule } from 'primeng/ripple';"));
must(i > -1, 'ripple import');
L.splice(i + 1, 0, "import { PopoverModule, Popover } from 'primeng/popover';");

// ElementRef, ViewChild
i = L.findIndex(l => l.startsWith("import { Component, inject, signal"));
must(i > -1, 'core import');
L[i] = "import { Component, inject, signal, OnInit, OnDestroy, computed, ElementRef, ViewChild } from '@angular/core';";

// PopoverModule in imports array
i = L.findIndex(l => l.trim() === 'RippleModule,');
must(i > -1, 'ripple in imports');
L.splice(i + 1, 0, '    PopoverModule,');

fs.writeFileSync(p, L.join('\n'));
console.log('IMPORTS OK');
