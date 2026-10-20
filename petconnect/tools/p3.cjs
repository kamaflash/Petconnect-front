const fs = require('fs');
const p = 'src/app/shared/presentation/components/header/header.component.ts';
let L = fs.readFileSync(p, 'utf8').split(/\r?\n/);
function must(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } }

// Replace the "onSearchInput ... clearSearch" block
const start = L.findIndex(l => l.includes('onSearchInput(event: Event): void {'));
must(start > -1, 'onSearchInput');
const end = L.findIndex((l, i) => i > start && l.trim() === '}' && L[i + 1].trim() === '');
must(end > -1, 'clearSearch end');

const block = [
  '  @ViewChild(\'searchInput\') searchInput?: ElementRef<HTMLInputElement>;',
  '  @ViewChild(\'searchPopover\') searchPopover?: Popover;',
  '',
  '  onSearchInput(event: Event): void {',
  '    const target = event.target as HTMLInputElement;',
  '    const value = target?.value ?? \'\';',
  '    this.searchQuery.set(value);',
  '    if (!value.trim()) {',
  '      this.searchResults.set([]);',
  '      this.closeSearchOverlay();',
  '      return;',
  '    }',
  '    this.openSearchOverlay();',
  '    this.searchDebounce.next(value);',
  '  }',
  '',
  '  /** Abre el overlay al enfocar el campo de búsqueda. */',
  '  onSearchFocus(): void {',
  '    if (this.searchQuery().trim()) {',
  '      this.openSearchOverlay();',
  '    }',
  '  }',
  '',
  '  private openSearchOverlay(): void {',
  '    const input = this.searchInput?.nativeElement;',
  '    const popover = this.searchPopover;',
  '    if (!input || !popover) return;',
  '    this.isSearchOpen.set(true);',
  '    if (!popover.overlayVisible) {',
  '      popover.show(undefined, input);',
  '    }',
  '  }',
  '',
  '  private closeSearchOverlay(): void {',
  '    this.isSearchOpen.set(false);',
  '    const popover = this.searchPopover;',
  '    if (popover?.overlayVisible) {',
  '      popover.hide();',
  '    }',
  '  }',
  '',
  '  /** Se dispara cuando el overlay se oculta (click fuera, ESC, etc.). */',
  '  onSearchOverlayHidden(): void {',
  '    this.isSearchOpen.set(false);',
  '  }',
  '',
  '  onSelectResult(result: SearchResult): void {',
  '    this.searchQuery.set(\'\');',
  '    this.searchResults.set([]);',
  '    this.closeSearchOverlay();',
  '    void this.router.navigateByUrl(result.route);',
  '  }',
  '',
  '  clearSearch(): void {',
  '    this.searchQuery.set(\'\');',
  '    this.searchResults.set([]);',
  '    this.closeSearchOverlay();',
  '    this.searchInput?.nativeElement.focus();',
  '  }',
];
L.splice(start, end - start + 1, ...block);

// Remove document click HostListener block (popover handles dismissal)
const cStart = L.findIndex(l => l.includes('@HostListener(\'document:click\''));
must(cStart > -1, 'hostlistener');
const cEnd = L.findIndex((l, i) => i > cStart && l.trim() === '}' && L[i + 1].trim() === '');
must(cEnd > -1, 'hostlistener end');
L.splice(cStart - 1, cEnd - cStart + 2, '  // El cierre por clic fuera / ESC lo gestiona el propio popover (dismissable).');

fs.writeFileSync(p, L.join('\n'));
console.log('LOGIC OK');
