const fs = require('fs');
const p = 'src/app/shared/presentation/components/header/header.component.ts';
let s = fs.readFileSync(p, 'utf8');
function must(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
const crlf = (t) => t.replace(/\n/g, '\r\n');

s = s.replace(
  "import { RippleModule } from 'primeng/ripple';",
  "import { RippleModule } from 'primeng/ripple';\nimport { PopoverModule, Popover } from 'primeng/popover';"
);
must(s.includes("from 'primeng/popover'"), 'import popover');

s = s.replace(
  "    RippleModule,\n    TranslocoModule,\n  ],",
  "    RippleModule,\n    PopoverModule,\n    TranslocoModule,\n  ],"
);
must(s.includes('PopoverModule,\r\n    TranslocoModule'), 'imports array');

s = s.replace(
  "import { Component, inject, signal, OnInit, OnDestroy, computed, HostListener } from '@angular/core';",
  "import { Component, inject, signal, OnInit, OnDestroy, computed, ElementRef, ViewChild } from '@angular/core';"
);
must(s.includes('ElementRef, ViewChild'), 'core import');

fs.writeFileSync(p, s);
console.log('STEP1 OK');

// STEP2: template
const oldTpl = `            <!-- Búsqueda global -->
            <div class="header-search">
              <input
                type="text"
                class="header-search-input"
                [placeholder]="'header.searchPlaceholder' | transloco"
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
                (focus)="isSearchOpen.set(true)"
                autocomplete="off"
              />
              <span class="header-search-icon">
                <i class="pi pi-search"></i>
              </span>
            </div>

            <!-- Resultados de búsqueda -->
            @if (isSearchOpen() && searchQuery().trim()) {
              <div class="header-search-results">
                <div class="search-results-header">
                  <span>{{ 'header.searchResults' | transloco }}</span>
                  <button type="button" class="clear-search-btn" (click)="clearSearch()">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
                @if (searchResults().length === 0) {
                  <div class="search-result-empty">
                    {{ 'header.searchNoResults' | transloco }}
                  </div>
                } @else {
                  @for (result of searchResults(); track result.type + result.id) {
                    <button type="button" class="search-result-item" (click)="onSelectResult(result)">
                      @if (result.image) {
                        <img [src]="result.image" [alt]="result.title" class="search-result-img" />
                      } @else {
                        <span class="search-result-img search-result-img-placeholder">
                          <i class="pi" [class]="typeIcon(result.type)"></i>
                        </span>
                      }
                      <div class="search-result-info">
                        <div class="search-result-title">{{ result.title }}</div>
                        @if (result.subtitle) {
                          <div class="search-result-subtitle">{{ result.subtitle }}</div>
                        }
                      </div>
                      <span class="search-result-type">{{ typeLabel(result.type) }}</span>
                    </button>
                  }
                }
              </div>
            }
         </div>`;

const newTpl = `            <!-- Búsqueda global -->
            <div class="header-search">
              <input
                #searchInput
                type="text"
                class="header-search-input"
                [placeholder]="'header.searchPlaceholder' | transloco"
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
                (focus)="onSearchFocus()"
                autocomplete="off"
              />
              <span class="header-search-icon">
                <i class="pi pi-search"></i>
              </span>
            </div>

            <!-- Resultados de búsqueda: overlay anclado al campo de búsqueda -->
            <p-popover
              #searchPopover
              styleClass="header-search-popover"
              appendTo="body"
              [dismissable]="true"
              [focusOnShow]="false"
              (onHide)="onSearchOverlayHidden()"
            >
              <div class="header-search-results">
                @if (searchQuery().trim()) {
                  <div class="search-results-header">
                    <span>{{ 'header.searchResults' | transloco }}</span>
                    <button type="button" class="clear-search-btn" (click)="clearSearch()">
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                  @if (searchResults().length === 0) {
                    <div class="search-result-empty">
                      {{ 'header.searchNoResults' | transloco }}
                    </div>
                  } @else {
                    @for (result of searchResults(); track result.type + result.id) {
                      <button type="button" class="search-result-item" (click)="onSelectResult(result)">
                        @if (result.image) {
                          <img [src]="result.image" [alt]="result.title" class="search-result-img" />
                        } @else {
                          <span class="search-result-img search-result-img-placeholder">
                            <i class="pi" [class]="typeIcon(result.type)"></i>
                          </span>
                        }
                        <div class="search-result-info">
                          <div class="search-result-title">{{ result.title }}</div>
                          @if (result.subtitle) {
                            <div class="search-result-subtitle">{{ result.subtitle }}</div>
                          }
                        </div>
                        <span class="search-result-type">{{ typeLabel(result.type) }}</span>
                      </button>
                    }
                  }
                }
              </div>
            </p-popover>
         </div>`;

must(s.includes(crlf(oldTpl)), 'template block found');
s = s.replace(crlf(oldTpl), crlf(newTpl));
fs.writeFileSync(p, s);
console.log('STEP2 OK');

// STEP3: styles
const oldCss = `    .header-search-results {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      z-index: 1000;
      width: 380px;
      max-width: 90vw;
      max-height: 420px;
      overflow-y: auto;
      padding: 0.35rem;
      background: var(--surface-card, #fff);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md, 12px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
    }`;
const newCss = `    /* Panel de resultados: se renderiza dentro de p-popover (overlay en body). */
    .header-search-results {
      width: 380px;
      max-width: min(380px, calc(100vw - 2rem));
      max-height: 420px;
      overflow-y: auto;
      padding: 0.35rem;
      background: var(--surface-card, #fff);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md, 12px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
    }

    /* El overlay vive en body: lo estilizamos vía ::ng-deep desde el host. */
    :host ::ng-deep .header-search-popover.p-popover {
      padding: 0;
      background: transparent;
      border: none;
      box-shadow: none;
    }

    :host ::ng-deep .header-search-popover .p-popover-content {
      padding: 0;
    }`;
must(s.includes(crlf(oldCss)), 'css block found');
s = s.replace(crlf(oldCss), crlf(newCss));
fs.writeFileSync(p, s);
console.log('STEP3 OK');

// STEP4: TS logic
const oldLogic = `  // ===== Búsqueda global =====
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.searchQuery.set(value);
    if (!value.trim()) {
      this.searchResults.set([]);
      this.isSearchOpen.set(false);
      return;
    }
    this.isSearchOpen.set(true);
    this.searchDebounce.next(value);
  }

  onSelectResult(result: SearchResult): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isSearchOpen.set(false);
    void this.router.navigateByUrl(result.route);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isSearchOpen.set(false);
  }`;

const newLogic = `  // ===== Búsqueda global =====
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('searchPopover') searchPopover?: Popover;

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.searchQuery.set(value);
    if (!value.trim()) {
      this.searchResults.set([]);
      this.closeSearchOverlay();
      return;
    }
    this.openSearchOverlay();
    this.searchDebounce.next(value);
  }

  /** Abre el overlay al enfocar el campo de búsqueda. */
  onSearchFocus(): void {
    if (this.searchQuery().trim()) {
      this.openSearchOverlay();
    }
  }

  private openSearchOverlay(): void {
    const input = this.searchInput?.nativeElement;
    const popover = this.searchPopover;
    if (!input || !popover) return;
    this.isSearchOpen.set(true);
    if (!popover.overlayVisible) {
      popover.show(undefined, input);
    }
  }

  private closeSearchOverlay(): void {
    this.isSearchOpen.set(false);
    const popover = this.searchPopover;
    if (popover?.overlayVisible) {
      popover.hide();
    }
  }

  /** Se dispara cuando el overlay se oculta (click fuera, ESC, etc.). */
  onSearchOverlayHidden(): void {
    this.isSearchOpen.set(false);
  }

  onSelectResult(result: SearchResult): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.closeSearchOverlay();
    void this.router.navigateByUrl(result.route);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.closeSearchOverlay();
    this.searchInput?.nativeElement.focus();
  }`;
must(s.includes(crlf(oldLogic)), 'logic block found');
s = s.replace(crlf(oldLogic), crlf(newLogic));

// STEP5: document click listener -> popover handles dismissal
const oldClick = `  // Cierre del desplegable al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isSearchOpen()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.header-search, .header-search-results')) {
      this.isSearchOpen.set(false);
    }
  }`;
const newClick = `  // El cierre por clic fuera / ESC lo gestiona el propio popover (dismissable).`;
must(s.includes(crlf(oldClick)), 'click block found');
s = s.replace(crlf(oldClick), crlf(newClick));

fs.writeFileSync(p, s);
console.log('STEP4 OK');
