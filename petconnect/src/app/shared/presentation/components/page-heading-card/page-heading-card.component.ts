import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-heading-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-heading-card">
      <div class="page-heading-copy">
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p>{{ subtitle }}</p>
        }
      </div>
      <ng-content select="[page-heading-actions]" />
    </header>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .page-heading-card { box-sizing: border-box; width: 100%; }
  `]
})
export class PageHeadingCardComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
