const fs = require('fs');
const p = 'src/app/shared/presentation/components/header/header.component.ts';
let L = fs.readFileSync(p, 'utf8').split(/\r?\n/);
function must(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } }

// --- Template: replace lines 44..95 (1-based) ---
const start = L.findIndex(l => l.includes('<!-- Búsqueda global -->'));
must(start > -1, 'tpl start');
// find end: the line '         </div>' that closes header-search block (index of "         </div>" after the @if block)
const end = L.findIndex((l, i) => i > start && l === '        </div>');
must(end > -1, 'tpl end');

const tpl = [
  '            <!-- Búsqueda global -->',
  '            <div class="header-search">',
  '              <input',
  '                #searchInput',
  '                type="text"',
  '                class="header-search-input"',
  '                [placeholder]="\'header.searchPlaceholder\' | transloco"',
  '                [value]="searchQuery()"',
  '                (input)="onSearchInput($event)"',
  '                (focus)="onSearchFocus()"',
  '                autocomplete="off"',
  '              />',
  '              <span class="header-search-icon">',
  '                <i class="pi pi-search"></i>',
  '              </span>',
  '            </div>',
  '',
  '            <!-- Resultados de búsqueda: overlay anclado al campo de búsqueda -->',
  '            <p-popover',
  '              #searchPopover',
  '              styleClass="header-search-popover"',
  '              appendTo="body"',
  '              [dismissable]="true"',
  '              [focusOnShow]="false"',
  '              (onHide)="onSearchOverlayHidden()"',
  '            >',
  '              <div class="header-search-results">',
  '                @if (searchQuery().trim()) {',
  '                  <div class="search-results-header">',
  '                    <span>{{ \'header.searchResults\' | transloco }}</span>',
  '                    <button type="button" class="clear-search-btn" (click)="clearSearch()">',
  '                      <i class="pi pi-times"></i>',
  '                    </button>',
  '                  </div>',
  '                  @if (searchResults().length === 0) {',
  '                    <div class="search-result-empty">',
  '                      {{ \'header.searchNoResults\' | transloco }}',
  '                    </div>',
  '                  } @else {',
  '                    @for (result of searchResults(); track result.type + result.id) {',
  '                      <button type="button" class="search-result-item" (click)="onSelectResult(result)">',
  '                        @if (result.image) {',
  '                          <img [src]="result.image" [alt]="result.title" class="search-result-img" />',
  '                        } @else {',
  '                          <span class="search-result-img search-result-img-placeholder">',
  '                            <i class="pi" [class]="typeIcon(result.type)"></i>',
  '                          </span>',
  '                        }',
  '                        <div class="search-result-info">',
  '                          <div class="search-result-title">{{ result.title }}</div>',
  '                          @if (result.subtitle) {',
  '                            <div class="search-result-subtitle">{{ result.subtitle }}</div>',
  '                          }',
  '                        </div>',
  '                        <span class="search-result-type">{{ typeLabel(result.type) }}</span>',
  '                      </button>',
  '                    }',
  '                  }',
  '                }',
  '              </div>',
  '            </p-popover>',
  '         </div>',
];
L.splice(start, end - start + 1, ...tpl);
fs.writeFileSync(p, L.join('\n'));
console.log('TEMPLATE OK');
