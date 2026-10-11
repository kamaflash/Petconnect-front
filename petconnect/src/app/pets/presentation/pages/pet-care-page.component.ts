import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { UserProfileResponse, MessagesApiService } from '../../../messages/infrastructure/services/messages-api.service';
import { PetCareActivity, PetCareActivityType, PetCareRole, PetCareShare, PetCareSummary, PetPassportSettings } from '../../domain/pet-care.model';
import { PetCareService } from '../../infrastructure/services/pet-care.service';

@Component({
  selector: 'app-pet-care-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <main class="care-page">
      <a class="back-link" routerLink="/pets"><i class="pi pi-arrow-left"></i> {{ 'petCare.backToFamily' | transloco }}</a>
      <header class="page-heading-card">
        <div class="heading-icon"><i class="pi pi-heart-fill"></i></div>
        <div>
          <p class="eyebrow">{{ 'petCare.eyebrow' | transloco }}</p>
          <h1>{{ pet()?.petName || ('petCare.title' | transloco) }}</h1>
          <p>{{ 'petCare.subtitle' | transloco }}</p>
        </div>
      </header>

      <div class="loading card-modern" *ngIf="loading()" aria-busy="true">
        <span class="pi pi-spin pi-spinner"></span> {{ 'petCare.loading' | transloco }}
      </div>
      <section class="card-modern error-card" *ngIf="!loading() && loadError()" role="alert">
        <i class="pi pi-exclamation-circle"></i>
        <p>{{ 'petCare.loadError' | transloco }}</p>
        <p-button [label]="'petCare.retry' | transloco" icon="pi pi-refresh" (onClick)="load()" />
      </section>

      <ng-container *ngIf="!loading() && !loadError() && pet() as petInfo">
        <section class="card-modern passport-card" *ngIf="petInfo.owner">
          <header class="section-header">
            <span class="section-icon"><i class="pi pi-id-card"></i></span>
            <div>
              <h2>{{ 'petCare.passportTitle' | transloco }}</h2>
              <p>{{ 'petCare.passportSubtitle' | transloco }}</p>
            </div>
          </header>
          <form (ngSubmit)="savePassport()" *ngIf="petInfo.owner">
            <label class="switch-row">
              <span><strong>{{ 'petCare.enablePassport' | transloco }}</strong><small>{{ 'petCare.enablePassportHelp' | transloco }}</small></span>
              <input type="checkbox" [ngModel]="passportEnabled()" (ngModelChange)="passportEnabled.set($event)" name="passportEnabled">
            </label>
            <div class="share-options" *ngIf="passportEnabled()">
              <p class="privacy-note"><i class="pi pi-lock"></i> {{ 'petCare.passportPrivacy' | transloco }}</p>
              <label><input type="checkbox" [ngModel]="shareMedical()" (ngModelChange)="shareMedical.set($event)" name="shareMedical"> {{ 'petCare.shareMedical' | transloco }}</label>
              <label><input type="checkbox" [ngModel]="shareEmergency()" (ngModelChange)="shareEmergency.set($event)" name="shareEmergency"> {{ 'petCare.shareEmergency' | transloco }}</label>
              <label><input type="checkbox" [ngModel]="shareVet()" (ngModelChange)="shareVet.set($event)" name="shareVet"> {{ 'petCare.shareVet' | transloco }}</label>
            </div>
            <div class="form-actions">
              <a class="passport-link" *ngIf="passportEnabled() && passportLink()" [href]="passportLink()" target="_blank" rel="noopener">
                <i class="pi pi-external-link"></i> {{ 'petCare.openPassport' | transloco }}
              </a>
              <p-button type="submit" icon="pi pi-check" [label]="'petCare.savePassport' | transloco" [loading]="savingPassport()" />
            </div>
          </form>
        </section>

        <section class="card-modern" *ngIf="petInfo.owner">
          <header class="section-header">
            <span class="section-icon"><i class="pi pi-users"></i></span>
            <div>
              <h2>{{ 'petCare.circleTitle' | transloco }}</h2>
              <p>{{ 'petCare.circleSubtitle' | transloco }}</p>
            </div>
          </header>
          <form class="invite-form" (ngSubmit)="invite()">
            <label class="field">
              <span>{{ 'petCare.searchPerson' | transloco }}</span>
              <input type="search" [(ngModel)]="personSearch" name="personSearch" [placeholder]="'petCare.searchPlaceholder' | transloco" autocomplete="off">
            </label>
            <label class="field">
              <span>{{ 'petCare.selectPerson' | transloco }}</span>
              <select [ngModel]="selectedUserId()" (ngModelChange)="selectedUserId.set($event)" name="selectedUserId" required>
                <option value="">{{ 'petCare.choosePerson' | transloco }}</option>
                <option *ngFor="let user of matchingUsers()" [value]="user.authUserId">{{ user.firstName }} {{ user.lastName }}</option>
              </select>
            </label>
            <label class="field">
              <span>{{ 'petCare.permission' | transloco }}</span>
              <select [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)" name="selectedRole">
                <option value="CAREGIVER">{{ 'petCare.caregiver' | transloco }}</option>
                <option value="VIEWER">{{ 'petCare.viewer' | transloco }}</option>
              </select>
            </label>
            <p-button type="submit" icon="pi pi-user-plus" [label]="'petCare.invite' | transloco" [disabled]="!selectedUserId()" [loading]="inviting()" />
          </form>
          <div class="empty-state" *ngIf="shares().length === 0">{{ 'petCare.noShares' | transloco }}</div>
          <ul class="share-list" *ngIf="shares().length > 0">
            <li *ngFor="let share of shares()">
              <div class="share-person">
                <span class="avatar">{{ share.userName.charAt(0) }}</span>
                <span><strong>{{ share.userName }}</strong><small>{{ roleLabel(share.role) }} · {{ statusLabel(share.status) }}</small></span>
              </div>
              <div class="share-actions" *ngIf="share.status === 'PENDING' || share.status === 'ACTIVE'">
                <select [ngModel]="share.role" (ngModelChange)="changeRole(share, $event)" [attr.aria-label]="'petCare.changePermission' | transloco">
                  <option value="CAREGIVER">{{ 'petCare.caregiver' | transloco }}</option>
                  <option value="VIEWER">{{ 'petCare.viewer' | transloco }}</option>
                </select>
                <button type="button" class="icon-action" (click)="revoke(share)" [attr.aria-label]="'petCare.revoke' | transloco" [title]="'petCare.revoke' | transloco">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </li>
          </ul>
        </section>

        <section class="card-modern">
          <header class="section-header">
            <span class="section-icon"><i class="pi pi-calendar-plus"></i></span>
            <div>
              <h2>{{ 'petCare.activityTitle' | transloco }}</h2>
              <p>{{ 'petCare.activitySubtitle' | transloco }}</p>
            </div>
          </header>
          <form class="activity-form" (ngSubmit)="addActivity()" *ngIf="petInfo.owner || petInfo.role === 'CAREGIVER'">
            <label class="field">
              <span>{{ 'petCare.activityType' | transloco }}</span>
              <select [ngModel]="activityType()" (ngModelChange)="activityType.set($event)" name="activityType">
                <option value="WALK">{{ 'petCare.walk' | transloco }}</option>
                <option value="MEDICATION">{{ 'petCare.medication' | transloco }}</option>
                <option value="FEEDING">{{ 'petCare.feeding' | transloco }}</option>
                <option value="VET_VISIT">{{ 'petCare.vetVisit' | transloco }}</option>
                <option value="OTHER">{{ 'petCare.other' | transloco }}</option>
              </select>
            </label>
            <label class="field activity-notes">
              <span>{{ 'petCare.notes' | transloco }}</span>
              <input type="text" maxlength="500" [ngModel]="activityNotes()" (ngModelChange)="activityNotes.set($event)" name="activityNotes">
            </label>
            <p-button type="submit" icon="pi pi-plus" [label]="'petCare.addActivity' | transloco" [loading]="savingActivity()" />
          </form>
          <div class="empty-state" *ngIf="activities().length === 0">{{ 'petCare.noActivities' | transloco }}</div>
          <ul class="activity-list" *ngIf="activities().length > 0">
            <li *ngFor="let activity of activities()">
              <span class="activity-marker"><i class="pi pi-check"></i></span>
              <div><strong>{{ activityLabel(activity.type) }}</strong><p *ngIf="activity.notes">{{ activity.notes }}</p><small>{{ activity.actorName }} · {{ activity.occurredAt | date:'short' }}</small></div>
            </li>
          </ul>
        </section>
      </ng-container>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .care-page { max-width: 980px; margin: 0 auto; display: grid; gap: 1rem; color: var(--text-primary); }
    .back-link, .passport-link { color: var(--text-secondary); text-decoration: none; display: inline-flex; align-items: center; gap: .5rem; width: fit-content; }
    .back-link:hover, .passport-link:hover { color: var(--text-primary); }
    .page-heading-card { display: flex; gap: 1rem; align-items: center; padding: 1.25rem 1.5rem; border-radius: var(--radius-lg); background: var(--surface-card); border: 1px solid var(--surface-border); }
    .heading-icon, .section-icon { width: 2.75rem; height: 2.75rem; display: grid; place-items: center; border-radius: var(--radius-md); background: var(--surface-hover); color: var(--text-primary); flex: 0 0 auto; }
    .heading-icon { font-size: 1.25rem; }
    .eyebrow { margin: 0 0 .25rem; color: var(--text-secondary); font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    h1, h2, p { margin-top: 0; }
    h1 { font-size: 1.5rem; margin-bottom: .25rem; }
    .page-heading-card p:last-child, .section-header p { margin: 0; color: var(--text-secondary); }
    .card-modern { padding: 1.25rem; border-radius: var(--radius-lg); background: var(--surface-card); border: 1px solid var(--surface-border); box-shadow: var(--shadow-sm); }
    .section-header { display: flex; align-items: flex-start; gap: .85rem; margin-bottom: 1.25rem; }
    .section-header h2 { margin: 0 0 .25rem; font-size: 1.1rem; }
    .switch-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .9rem 0; }
    .switch-row span, .share-person span:last-child { display: grid; gap: .2rem; }
    small { color: var(--text-secondary); }
    .switch-row input, .share-options input { accent-color: var(--primary-color); }
    .switch-row input { width: 1.2rem; height: 1.2rem; }
    .share-options { display: grid; gap: .8rem; padding: 1rem; background: var(--surface-hover); border-radius: var(--radius-md); }
    .share-options label { display: flex; align-items: center; gap: .6rem; }
    .privacy-note { margin: 0; display: flex; gap: .5rem; color: var(--text-secondary); }
    .form-actions { margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .invite-form, .activity-form { display: flex; align-items: end; gap: .75rem; flex-wrap: wrap; }
    .field { min-width: 170px; flex: 1; display: grid; gap: .4rem; font-size: .875rem; color: var(--text-secondary); }
    .field input, .field select, .share-actions select { width: 100%; min-height: 2.65rem; padding: .55rem .7rem; color: var(--text-primary); background: var(--surface-bg); border: 1px solid var(--surface-border); border-radius: var(--radius-md); }
    .activity-notes { flex: 2; }
    .share-list, .activity-list { list-style: none; padding: 0; margin: 1rem 0 0; }
    .share-list li, .activity-list li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .85rem 0; border-top: 1px solid var(--surface-border); }
    .share-person { display: flex; align-items: center; gap: .7rem; min-width: 0; }
    .avatar, .activity-marker { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: var(--surface-hover); display: grid; place-items: center; flex: 0 0 auto; }
    .share-actions { display: flex; gap: .5rem; align-items: center; }
    .share-actions select { min-width: 125px; }
    .icon-action { width: 2.5rem; height: 2.5rem; border-radius: 50%; border: 1px solid var(--surface-border); color: var(--text-secondary); background: transparent; cursor: pointer; }
    .icon-action:hover { background: var(--surface-hover); color: var(--text-primary); }
    .activity-list li { justify-content: flex-start; align-items: flex-start; }
    .activity-list p { margin: .2rem 0; }
    .activity-list small { display: block; margin-top: .35rem; }
    .empty-state, .loading, .error-card { color: var(--text-secondary); }
    .error-card { display: grid; justify-items: start; gap: .6rem; }
    @media (max-width: 600px) {
      .care-page { gap: .75rem; }
      .card-modern { padding: 1rem; }
      .invite-form, .activity-form { align-items: stretch; }
      .field, .activity-notes { flex-basis: 100%; }
      .share-list li { align-items: flex-start; flex-direction: column; }
      .share-actions { width: 100%; }
      .share-actions select { flex: 1; }
    }
  `]
})
export class PetCarePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly careService = inject(PetCareService);
  private readonly messagesApi = inject(MessagesApiService);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly i18n = inject(TranslocoService);

  readonly pet = signal<PetCareSummary | null>(null);
  readonly passport = signal<PetPassportSettings | null>(null);
  readonly shares = signal<PetCareShare[]>([]);
  readonly activities = signal<PetCareActivity[]>([]);
  readonly profiles = signal<UserProfileResponse[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly savingPassport = signal(false);
  readonly inviting = signal(false);
  readonly savingActivity = signal(false);
  readonly passportEnabled = signal(false);
  readonly shareMedical = signal(false);
  readonly shareEmergency = signal(false);
  readonly shareVet = signal(false);
  readonly selectedUserId = signal('');
  readonly selectedRole = signal<PetCareRole>('CAREGIVER');
  readonly activityType = signal<PetCareActivityType>('WALK');
  readonly activityNotes = signal('');
  personSearch = '';
  private petId = '';

  readonly passportLink = computed(() => {
    const token = this.passport()?.token;
    return token ? `${window.location.origin}/passport/${token}` : '';
  });

  readonly matchingUsers = computed(() => {
    const query = this.personSearch.trim().toLocaleLowerCase();
    const currentId = this.auth.user()?.id;
    return this.profiles()
      .filter(user => user.authUserId !== currentId)
      .filter(user => !query || `${user.firstName} ${user.lastName}`.toLocaleLowerCase().includes(query))
      .slice(0, 20);
  });

  ngOnInit(): void {
    this.petId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    if (!this.petId) {
      this.loading.set(false);
      this.loadError.set(true);
      return;
    }
    this.careService.getCareSummary(this.petId).subscribe({
      next: pet => {
        this.pet.set(pet);
        this.loading.set(false);
        this.careService.getActivities(this.petId).subscribe({
          next: activities => this.activities.set(activities),
          error: () => this.notifyError('petCare.activitiesLoadError')
        });
        if (pet.owner) {
          this.careService.getPassportSettings(this.petId).subscribe({
            next: settings => this.setPassport(settings),
            error: () => this.notifyError('petCare.passportLoadError')
          });
          this.careService.getShares(this.petId).subscribe({
            next: shares => this.shares.set(shares),
            error: () => this.notifyError('petCare.sharesLoadError')
          });
          this.messagesApi.getAllProfiles().subscribe({
            next: profiles => this.profiles.set(profiles),
            error: () => this.notifyError('petCare.profilesLoadError')
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  savePassport(): void {
    this.savingPassport.set(true);
    this.careService.updatePassport(this.petId, {
      enabled: this.passportEnabled(),
      shareMedical: this.passportEnabled() && this.shareMedical(),
      shareEmergencyContact: this.passportEnabled() && this.shareEmergency(),
      shareVet: this.passportEnabled() && this.shareVet()
    }).subscribe({
      next: settings => {
        this.setPassport(settings);
        this.savingPassport.set(false);
        this.notifySuccess('petCare.passportSaved');
      },
      error: () => {
        this.savingPassport.set(false);
        this.notifyError('petCare.saveError');
      }
    });
  }

  invite(): void {
    const userId = this.selectedUserId();
    if (!userId) return;
    this.inviting.set(true);
    this.careService.invite(this.petId, userId, this.selectedRole()).subscribe({
      next: share => {
        this.shares.update(items => [...items.filter(item => item.id !== share.id), share]);
        this.selectedUserId.set('');
        this.inviting.set(false);
        this.notifySuccess('petCare.inviteSent');
      },
      error: () => {
        this.inviting.set(false);
        this.notifyError('petCare.inviteError');
      }
    });
  }

  changeRole(share: PetCareShare, role: PetCareRole): void {
    this.careService.updateRole(this.petId, share.id, role).subscribe({
      next: updated => this.shares.update(items => items.map(item => item.id === updated.id ? updated : item)),
      error: () => this.notifyError('petCare.roleError')
    });
  }

  revoke(share: PetCareShare): void {
    this.careService.revokeShare(this.petId, share.id).subscribe({
      next: () => this.shares.update(items => items.map(item => item.id === share.id ? { ...item, status: 'REVOKED' } : item)),
      error: () => this.notifyError('petCare.revokeError')
    });
  }

  addActivity(): void {
    this.savingActivity.set(true);
    this.careService.addActivity(this.petId, this.activityType(), this.activityNotes()).subscribe({
      next: activity => {
        this.activities.update(items => [activity, ...items]);
        this.activityNotes.set('');
        this.savingActivity.set(false);
        this.notifySuccess('petCare.activitySaved');
      },
      error: () => {
        this.savingActivity.set(false);
        this.notifyError('petCare.activityError');
      }
    });
  }

  roleLabel(role: PetCareRole): string {
    return this.i18n.translate(role === 'CAREGIVER' ? 'petCare.caregiver' : 'petCare.viewer');
  }

  statusLabel(status: PetCareShare['status']): string {
    return this.i18n.translate(`petCare.status.${status}`);
  }

  activityLabel(type: PetCareActivityType): string {
    return this.i18n.translate(`petCare.activity.${type}`);
  }

  private setPassport(settings: PetPassportSettings): void {
    this.passport.set(settings);
    this.passportEnabled.set(settings.enabled);
    this.shareMedical.set(settings.shareMedical);
    this.shareEmergency.set(settings.shareEmergencyContact);
    this.shareVet.set(settings.shareVet);
  }

  private notifySuccess(key: string): void {
    this.messageService.add({
      severity: 'success',
      summary: this.i18n.translate('petCare.success'),
      detail: this.i18n.translate(key)
    });
  }

  private notifyError(key: string): void {
    this.messageService.add({
      severity: 'error',
      summary: this.i18n.translate('petCare.error'),
      detail: this.i18n.translate(key)
    });
  }
}
