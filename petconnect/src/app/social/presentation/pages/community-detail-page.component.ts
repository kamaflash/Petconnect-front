import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { CommunityFormDialogComponent } from '../components/community-form-dialog/community-form-dialog.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import {
  SocialService,
  CommunityDraft,
  CommunityResponse,
} from '../../infrastructure/services/social.service';

/**
 * Detalle de un círculo de comunidad.
 *
 * Reutiliza el contrato de la lista: el servidor decide si el visitante es
 * miembro, así que el botón de unirse/salir se pinta a partir de `member`.
 * Las acciones de propiedad se pintan a partir de `owner`, que solo el backend
 * puede poner en true: un cliente que las muestre a mano seguirá recibiendo 403.
 */
@Component({
  selector: 'app-community-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    SkeletonModule,
    ToastModule,
    DialogModule,
    TranslocoModule,
    PageHeadingCardComponent,
    CommunityFormDialogComponent,
  ],
  providers: [MessageService],
  template: `
    <app-page-heading-card
      [title]="t('social.communities.detailTitle')"
      [subtitle]="t('social.communities.detailSubtitle')"
    ></app-page-heading-card>

    <p-toast />

    <a routerLink="/social/communities" class="circle-back">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      {{ t('social.communities.backToList') }}
    </a>

    @if (loading()) {
      <p-card styleClass="circle-detail-card">
        <ng-template pTemplate="content">
          <p-skeleton styleClass="mb-2" height="6rem" />
          <p-skeleton width="50%" styleClass="mb-2" />
          <p-skeleton width="90%" />
        </ng-template>
      </p-card>
    } @else if (error()) {
      <p class="circle-empty">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        {{ t('social.communities.notFound') }}
      </p>
      <button pButton type="button" [label]="t('social.communities.retry')" (click)="load()"></button>
    } @else if (community(); as circle) {
      <p-card styleClass="circle-detail-card">
        <ng-template pTemplate="header">
          <div class="circle-head">
            <p-avatar
              [image]="circle.avatarUrl"
              [label]="circle.name.charAt(0)"
              size="xlarge"
              shape="circle"
            />
            <div class="circle-heading-copy">
              <h2>{{ circle.name }}</h2>
              <div class="circle-tags">
                @if (circle.owner) {
                  <p-tag
                    [value]="t('social.communities.ownerBadge')"
                    severity="success"
                    icon="pi pi-lock"
                  />
                }
                @if (circle.topic) {
                  <p-tag [value]="topicLabel(circle.topic)" severity="info" />
                }
                <p-tag [value]="circle.category" />
              </div>
            </div>
          </div>
        </ng-template>

        <p class="circle-description">{{ circle.description }}</p>

        <ng-template pTemplate="footer">
          <div class="circle-footer">
            <span class="circle-members">
              <i class="pi pi-users" aria-hidden="true"></i>
              {{ memberCountLabel(circle.membersCount) }}
            </span>
            <div class="circle-actions">
              @if (circle.owner) {
                <button
                  pButton
                  type="button"
                  icon="pi pi-pencil"
                  class="p-button-outlined p-button-secondary"
                  [label]="t('social.communities.edit')"
                  (click)="openEdit(circle)"
                ></button>
                <button
                  pButton
                  type="button"
                  icon="pi pi-trash"
                  class="p-button-outlined p-button-danger"
                  [label]="t('social.communities.delete')"
                  [disabled]="pending()"
                  (click)="showDelete = true"
                ></button>
              }
              <button
                pButton
                type="button"
                [icon]="circle.member ? 'pi pi-times' : 'pi pi-plus'"
                [label]="circle.member ? t('social.communities.leave') : t('social.communities.join')"
                [class.p-button-secondary]="circle.member"
                [loading]="pending()"
                (click)="toggleMembership()"
              ></button>
            </div>
          </div>
        </ng-template>
      </p-card>

      <app-community-form-dialog
        #formDialog
        (saved)="saveEdit($event)"
      ></app-community-form-dialog>

      <p-dialog
        [(visible)]="showDelete"
        [header]="t('social.communities.deleteTitle')"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closable]="!pending()"
        styleClass="confirm-delete-dialog"
      >
        <p class="confirm-copy">{{ t('social.communities.deleteConfirm') }}</p>
        <p class="confirm-detail">{{ t('social.communities.deleteConfirmDetail') }}</p>
        <ng-template pTemplate="footer">
          <button
            pButton
            type="button"
            [label]="t('social.communities.form.cancel')"
            class="p-button-text"
            [disabled]="pending()"
            (click)="showDelete = false"
          ></button>
          <button
            pButton
            type="button"
            icon="pi pi-trash"
            [label]="t('social.communities.delete')"
            class="p-button-danger"
            [loading]="pending()"
            (click)="confirmDelete()"
          ></button>
        </ng-template>
      </p-dialog>
    }
  `,

  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .circle-back {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        margin: 1rem 0;
        text-decoration: none;
      }

      .circle-head {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
      }
      .circle-heading-copy {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 0;
      }
      .circle-heading-copy h2 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 600;
      }
      .circle-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .circle-description {
        margin: 0;
        color: var(--p-text-muted-color, #6b7280);
      }

      .circle-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .circle-members {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.9rem;
        color: var(--p-text-muted-color, #6b7280);
      }
      .circle-actions {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .confirm-copy {
        margin: 0 0 0.5rem;
        font-weight: 600;
      }
      .confirm-detail {
        margin: 0;
        color: var(--p-text-muted-color, #6b7280);
      }

      .circle-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2.5rem 1rem;
        color: var(--p-text-muted-color, #6b7280);
      }
    `,
  ],
})
export class CommunityDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);
  private readonly messageService = inject(MessageService);

  @ViewChild('formDialog') formDialog?: CommunityFormDialogComponent;

  readonly community = signal<CommunityResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pending = signal(false);

  /** Controla el diálogo de confirmación de borrado. */
  showDelete = false;

  private communityId = '';

  ngOnInit(): void {
    this.communityId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.i18n.translate(key, params);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.social.getCommunityById(this.communityId).subscribe({
      next: (circle) => {
        this.community.set(circle);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(this.t('social.communities.loadError'), err);
        this.error.set(err?.message ?? null);
        this.loading.set(false);
      },
    });
  }

  toggleMembership(): void {
    const circle = this.community();
    if (!circle || this.pending()) {
      return;
    }
    if (!this.auth.user()) {
      this.notify(
        'warn',
        'social.communities.loginRequiredTitle',
        'social.communities.loginRequired'
      );
      return;
    }

    const wasMember = circle.member;
    this.pending.set(true);
    const request$ = wasMember
      ? this.social.leaveCommunity(circle.id)
      : this.social.joinCommunity(circle.id);

    request$.subscribe({
      next: (updated) => {
        this.pending.set(false);
        this.community.set(updated);
        this.notify(
          'success',
          wasMember ? 'social.communities.leftTitle' : 'social.communities.joinedTitle',
          wasMember ? 'social.communities.left' : 'social.communities.joined'
        );
      },
      error: (err) => {
        this.pending.set(false);
        console.error(this.t('social.communities.membershipError'), err);
        this.notify(
          'error',
          'social.communities.membershipErrorTitle',
          'social.communities.membershipError'
        );
      },
    });
  }

  /** Abre el formulario de edición precargado con los datos actuales. */
  openEdit(circle: CommunityResponse): void {
    this.formDialog?.open(circle);
  }

  /** Persiste la edición y refresca la ficha con la respuesta del servidor. */
  saveEdit(draft: CommunityDraft): void {
    if (this.pending()) {
      return;
    }
    this.pending.set(true);
    if (this.formDialog) {
      this.formDialog.saving = true;
    }

    this.social.updateCommunity(this.communityId, draft).subscribe({
      next: (updated) => {
        this.pending.set(false);
        if (this.formDialog) {
          this.formDialog.saving = false;
          this.formDialog.close();
        }
        this.community.set(updated);
        this.notify('success', 'social.communities.updatedTitle', 'social.communities.updated');
      },
      error: (err) => {
        this.pending.set(false);
        // El diálogo se mantiene abierto para no perder lo escrito.
        if (this.formDialog) {
          this.formDialog.saving = false;
        }
        console.error(this.t('social.communities.saveError'), err);
        this.notify('error', 'social.communities.saveErrorTitle', 'social.communities.saveError');
      },
    });
  }

  /** Baja lógica y salida de la ficha: la URL dejaría de responder 200. */
  confirmDelete(): void {
    if (this.pending()) {
      return;
    }
    this.pending.set(true);

    this.social.deleteCommunity(this.communityId).subscribe({
      next: () => {
        this.pending.set(false);
        this.showDelete = false;
        this.notify('success', 'social.communities.deletedTitle', 'social.communities.deleted');
        this.router.navigate(['/social/communities']);
      },
      error: (err) => {
        this.pending.set(false);
        this.showDelete = false;
        console.error(this.t('social.communities.deleteError'), err);
        this.notify('error', 'social.communities.deleteErrorTitle', 'social.communities.deleteError');
      },
    });
  }

  topicLabel(topic: string | null): string {
    return topic ? this.t(`social.communities.topics.${topic}`) : '';
  }

  memberCountLabel(count: number): string {
    return this.t('social.communities.membersCount', { count });
  }

  private notify(severity: string, titleKey: string, detailKey: string): void {
    this.messageService.add({
      severity,
      summary: this.t(titleKey),
      detail: this.t(detailKey),
    });
  }
}

