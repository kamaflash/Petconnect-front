import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <i class="pi {{ icon() }}" *ngIf="icon()"></i>
      <div class="stat-content">
        <span class="stat-value">{{ value() }}</span>
        <span class="stat-label">{{ label() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      padding: 1rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s;
      cursor: default;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-card i {
      font-size: 2rem;
      color: var(--primary-color);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }
  `]
})
export class StatCardComponent {
  icon = input<string>('');
  value = input.required<string | number>();
  label = input.required<string>();
}
