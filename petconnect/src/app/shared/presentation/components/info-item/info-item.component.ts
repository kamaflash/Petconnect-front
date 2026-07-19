import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="info-item" [class.full-width]="fullWidth()">
      <span class="info-label">{{ label() }}</span>
      <span class="info-value">{{ value() }}</span>
    </div>
  `,
  styles: [`
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .info-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }
  `]
})
export class InfoItemComponent {
  label = input.required<string>();
  value = input.required<string>();
  fullWidth = input<boolean>(false);
}
