import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PetCareShare } from '../../domain/pet-care.model';
import { PetCareService } from '../../infrastructure/services/pet-care.service';

@Component({
  selector: 'app-pet-care-invitations-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <main class="invitations-page">
      <a routerLink="/pets" class="back-link"><i class="pi pi-arrow-left"></i> {{ 'petCare.backToFamily' | transloco }}</a>
      <header class="page-heading-card">
        <span class="heading-icon"><i class="pi pi-users"></i></span>
        <div><h1>{{ 'petCare.invitationsTitle' | transloco }}</h1><p>{{ 'petCare.invitationsSubtitle' | transloco }}</p></div>
      </header>
      <section class="card-modern" *ngIf="loading()" aria-busy="true"><i class="pi pi-spin pi-spinner"></i> {{ 'petCare.loading' | transloco }}</section>
      <section class="card-modern empty" *ngIf="!loading() && invitations().length === 0">
        <i class="pi pi-inbox"></i><h2>{{ 'petCare.noInvitations' | transloco }}</h2><p>{{ 'petCare.noInvitationsHelp' | transloco }}</p>
      </section>
      <section class="card-modern invitation" *ngFor="let invitation of invitations()">
        <div><p>{{ 'petCare.invitedBy' | transloco:{ owner: invitation.ownerName } }}</p><h2>{{ invitation.petName }}</h2>
          <span>{{ invitation.role === 'CAREGIVER' ? ('petCare.caregiver' | transloco) : ('petCare.viewer' | transloco) }}</span></div>
        <div class="actions" *ngIf="invitation.status === 'PENDING'">
          <p-button severity="secondary" [outlined]="true" [label]="'petCare.decline' | transloco" (onClick)="respond(invitation, 'DECLINED')" [loading]="busyId() === invitation.id" />
          <p-button [label]="'petCare.accept' | transloco" icon="pi pi-check" (onClick)="respond(invitation, 'ACTIVE')" [loading]="busyId() === invitation.id" />
        </div>
        <div class="actions" *ngIf="invitation.status === 'ACTIVE'">
          <span class="status">{{ 'petCare.status.ACTIVE' | transloco }}</span>
          <a [routerLink]="['/pets', invitation.petId, 'care']">{{ 'petCare.openCare' | transloco }} <i class="pi pi-arrow-right"></i></a>
          <button type="button" class="leave-button" (click)="leave(invitation)" [disabled]="busyId() === invitation.id">
            {{ 'petCare.leave' | transloco }}
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .invitations-page { max-width: 900px; margin: 0 auto; display: grid; gap: 1rem; color: var(--text-primary); }
    .back-link { color: var(--text-secondary); text-decoration: none; width: fit-content; display: flex; align-items: center; gap: .5rem; }
    .page-heading-card, .card-modern { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--radius-lg); padding: 1.25rem; }
    .page-heading-card { display: flex; align-items: center; gap: 1rem; }
    .heading-icon { width: 2.75rem; height: 2.75rem; border-radius: var(--radius-md); display: grid; place-items: center; background: var(--surface-hover); }
    h1, h2, p { margin-top: 0; }
    h1 { margin-bottom: .25rem; font-size: 1.4rem; }
    .page-heading-card p, .empty p, .invitation span { color: var(--text-secondary); margin: 0; }
    .invitation { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .invitation h2 { margin-bottom: .25rem; }
    .invitation p { margin: 0 0 .3rem; color: var(--text-secondary); }
    .actions { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; }
    .actions a { color: var(--text-primary); text-decoration: none; }
    .leave-button { border: 1px solid var(--surface-border); border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); padding: .5rem .7rem; cursor: pointer; }
    .leave-button:hover { background: var(--surface-hover); color: var(--text-primary); }
    .status { padding: .45rem .7rem; border-radius: var(--radius-full); background: var(--surface-hover); }
    .empty { text-align: center; padding: 2.5rem 1rem; }
    .empty > i { font-size: 2rem; }
    .empty h2 { margin: .75rem 0 .3rem; }
    @media (max-width: 600px) { .invitation { align-items: flex-start; flex-direction: column; } .actions { width: 100%; } }
  `]
})
export class PetCareInvitationsPageComponent implements OnInit {
  private readonly service = inject(PetCareService);
  private readonly messages = inject(MessageService);
  private readonly i18n = inject(TranslocoService);
  readonly invitations = signal<PetCareShare[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal('');

  ngOnInit(): void {
    this.service.getInvitations().subscribe({
      next: invitations => {
        this.invitations.set(invitations.filter(item => item.status === 'PENDING' || item.status === 'ACTIVE'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: this.i18n.translate('petCare.error'),
          detail: this.i18n.translate('petCare.invitationsLoadError')
        });
      }
    });
  }

  respond(invitation: PetCareShare, status: 'ACTIVE' | 'DECLINED'): void {
    this.busyId.set(invitation.id);
    this.service.respondToInvitation(invitation.id, status).subscribe({
      next: updated => {
        this.invitations.update(items => items.map(item => item.id === updated.id ? updated : item));
        this.busyId.set('');
      },
      error: () => {
        this.busyId.set('');
        this.messages.add({
          severity: 'error',
          summary: this.i18n.translate('petCare.error'),
          detail: this.i18n.translate('petCare.invitationResponseError')
        });
      }
    });
  }

  leave(invitation: PetCareShare): void {
    this.busyId.set(invitation.id);
    this.service.leaveShare(invitation.id).subscribe({
      next: () => {
        this.invitations.update(items => items.filter(item => item.id !== invitation.id));
        this.busyId.set('');
      },
      error: () => {
        this.busyId.set('');
        this.messages.add({
          severity: 'error',
          summary: this.i18n.translate('petCare.error'),
          detail: this.i18n.translate('petCare.leaveError')
        });
      }
    });
  }
}
