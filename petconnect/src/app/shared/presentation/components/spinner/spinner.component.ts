import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SpinnerService } from '../../../infrastructure/services/spinner.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    @if (visible()) {
      <div class="spinner-overlay">
        <div class="spinner-container">
          <p-progressSpinner
            strokeWidth="4"
            animationDuration="1000ms"
            class="spinner"
          />
          <p class="spinner-text">{{ message() }}</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      background-color: var(--bitbucket-header-bg);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }

    :host ::ng-deep .spinner .p-progress-spinner {
      width: 60px;
      height: 60px;
    }

    :host ::ng-deep .spinner .p-progress-spinner-circle {
      stroke: var(--primary-color);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .spinner-text {
      color: var(--bitbucket-text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      margin: 0;
    }

    /* Dark mode */
    .dark .spinner-container {
      background-color: #1f2937;
    }
  `]
})
export class SpinnerComponent {
  private readonly spinnerService = inject(SpinnerService);

  visible = this.spinnerService.visible;
  message = this.spinnerService.message;
}
