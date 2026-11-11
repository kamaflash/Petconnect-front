import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../infrastructure/services/auth.service';

type ConfirmationState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule, ButtonModule],
  template: `
    <section class="auth-card email-confirmation">
      <div class="auth-header">
        <div class="auth-logo">
          <div class="auth-logo-icon"><i class="pi pi-envelope" aria-hidden="true"></i></div>
          <span class="auth-logo-text">Petconnect</span>
        </div>
        <h1>{{ 'settings.emailConfirmationTitle' | transloco }}</h1>
      </div>

      @if (state() === 'loading') {
        <p class="confirmation-message" role="status">{{ 'settings.emailConfirmationLoading' | transloco }}</p>
      } @else if (state() === 'success') {
        <p class="confirmation-message" role="status">{{ 'settings.emailConfirmationSuccess' | transloco }}</p>
        <p-button [label]="'auth.login' | transloco" routerLink="/auth/login" />
      } @else {
        <p class="confirmation-message confirmation-error" role="alert">{{ 'settings.emailConfirmationError' | transloco }}</p>
        <p-button [label]="'auth.login' | transloco" routerLink="/auth/login" severity="secondary" [outlined]="true" />
      }
    </section>
  `,
  styles: [`
    .email-confirmation {
      text-align: center;
    }

    .auth-header h1 {
      margin: 1.25rem 0 0;
      color: var(--text-primary);
      font-size: 1.375rem;
    }

    .confirmation-message {
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0 0 1.25rem;
    }

    .confirmation-error {
      color: var(--red-600, #dc2626);
    }
  `]
})
export class ConfirmEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly state = signal<ConfirmationState>('loading');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    void this.confirm(token);
  }

  private async confirm(token: string): Promise<void> {
    try {
      await this.authService.confirmEmailChange(token);
      this.state.set('success');
    } catch {
      this.state.set('error');
    }
  }
}
