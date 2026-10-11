import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { PetResponse } from '../../../pets/domain/pet.model';
import { PetService } from '../../../pets/infrastructure/services/pet.service';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonModule, TranslocoModule, PageHeadingCardComponent],
  template: `
    <main class="page-content agenda-page">
      <app-page-heading-card
        [title]="'agenda.title' | transloco"
        [subtitle]="'agenda.subtitle' | transloco"
      />

      @if (loading()) {
        <section class="agenda-card card-modern" aria-busy="true">
          <div class="card-header">
            <p-skeleton shape="circle" size="1.25rem" />
            <p-skeleton width="12rem" height="1rem" />
          </div>
          <div class="card-body agenda-loading-list" aria-hidden="true">
            @for (placeholder of [1, 2, 3]; track placeholder) {
              <div class="agenda-loading-item">
                <p-skeleton shape="circle" size="2.6rem" />
                <div>
                  <p-skeleton width="8rem" height=".9rem" />
                  <p-skeleton width="13rem" height=".75rem" />
                </div>
              </div>
            }
          </div>
        </section>
      } @else if (loadFailed()) {
        <section class="agenda-card card-modern" role="alert">
          <div class="agenda-state">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            <h2>{{ 'agenda.errorTitle' | transloco }}</h2>
            <p>{{ 'agenda.error' | transloco }}</p>
            <button type="button" class="agenda-button" (click)="loadPets()">
              <i class="pi pi-refresh" aria-hidden="true"></i>
              {{ 'agenda.retry' | transloco }}
            </button>
          </div>
        </section>
      } @else {
        <section class="agenda-card card-modern">
          <div class="card-header">
            <i class="pi pi-heart card-header-icon" aria-hidden="true"></i>
            <h2 class="card-header-title">{{ 'agenda.vaccinationsTitle' | transloco }}</h2>
            <span class="agenda-count">{{ reminders().length }}</span>
          </div>
          <div class="card-body">
            @if (reminders().length) {
              <p class="agenda-description">{{ 'agenda.vaccinationsDescription' | transloco }}</p>
              <ul class="reminder-list">
                @for (pet of reminders(); track pet.id) {
                  <li class="reminder-item">
                    <div class="reminder-icon" [class.overdue]="isOverdue(pet.nextVaccinationDate)">
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                    </div>
                    <div class="reminder-details">
                      <a
                        class="reminder-pet"
                        [routerLink]="['/profile/pet', pet.id]"
                        [queryParams]="{ tab: 'health' }"
                      >{{ pet.name }}</a>
                      <span class="reminder-status" [class.overdue-text]="isOverdue(pet.nextVaccinationDate)">
                        {{ (isOverdue(pet.nextVaccinationDate) ? 'agenda.overdue' : 'agenda.nextVaccination') | transloco }}
                        · {{ pet.nextVaccinationDate | date:'mediumDate' }}
                      </span>
                    </div>
                    <a
                      class="reminder-link"
                      [routerLink]="['/profile/pet', pet.id]"
                      [queryParams]="{ tab: 'health' }"
                      [attr.aria-label]="'agenda.openPetHealth' | transloco:{ name: pet.name }"
                    ><i class="pi pi-arrow-up-right" aria-hidden="true"></i></a>
                  </li>
                }
              </ul>
            } @else {
              <div class="agenda-empty">
                <i class="pi pi-calendar-plus" aria-hidden="true"></i>
                <div>
                  <h3>{{ 'agenda.emptyTitle' | transloco }}</h3>
                  <p>{{ 'agenda.emptyDescription' | transloco }}</p>
                </div>
                <a class="agenda-button" routerLink="/pets">
                  <i class="pi pi-paw" aria-hidden="true"></i>
                  {{ 'agenda.goToFamily' | transloco }}
                </a>
              </div>
            }
          </div>
        </section>

        <section class="appointments-note card-modern">
          <span class="appointments-note-icon"><i class="pi pi-info-circle" aria-hidden="true"></i></span>
          <div>
            <h2>{{ 'agenda.appointmentsTitle' | transloco }}</h2>
            <p>{{ 'agenda.appointmentsDescription' | transloco }}</p>
          </div>
          <a routerLink="/nearby">{{ 'agenda.findProfessionals' | transloco }}</a>
        </section>
      }
    </main>
  `,
  styles: [`
    :host { display: block; }
    .agenda-page { max-width: var(--max-page-width); margin: 0 auto; }
    .card-modern { overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--surface-border); border-radius: var(--radius-lg); background: var(--surface-card); }
    .card-header { display: flex; align-items: center; gap: .5rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--surface-border); background: color-mix(in srgb, var(--primary-color) 5%, var(--surface-card)); }
    .card-header-icon { color: var(--primary-color); font-size: 1.125rem; }
    .card-header-title { margin: 0; color: var(--text-primary); font-size: .9375rem; font-weight: 600; }
    .card-body { padding: .75rem 1.25rem; }
    .agenda-loading-list { display: grid; gap: .65rem; }
    .agenda-loading-item { display: flex; align-items: center; gap: .85rem; padding: .85rem; border: 1px solid var(--surface-border); border-radius: var(--radius-md); }
    .agenda-loading-item > div { display: grid; gap: .45rem; }
    .agenda-card { overflow: hidden; }
    .agenda-count { display: grid; place-items: center; min-width: 1.75rem; height: 1.75rem; margin-left: auto; padding: 0 .45rem; border-radius: 999px; background: var(--surface-hover); color: var(--text-secondary); font-size: .8rem; font-weight: 700; }
    .agenda-description { margin: 0 0 1rem; color: var(--text-secondary); font-size: .9rem; }
    .reminder-list { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
    .reminder-item { display: flex; align-items: center; gap: .85rem; padding: .85rem; border: 1px solid var(--surface-border); border-radius: var(--radius-md); background: var(--surface-card); }
    .reminder-icon { display: grid; flex: 0 0 auto; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: .85rem; background: color-mix(in srgb, var(--primary-color) 12%, var(--surface-card)); color: var(--primary-color); }
    .reminder-icon.overdue { background: color-mix(in srgb, #ef4444 12%, var(--surface-card)); color: #dc2626; }
    .reminder-details { display: grid; gap: .2rem; min-width: 0; }
    .reminder-pet { overflow: hidden; color: var(--text-primary); font-weight: 700; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
    .reminder-pet:hover { color: var(--primary-color); }
    .reminder-status { color: var(--text-secondary); font-size: .82rem; }
    .reminder-status.overdue-text { color: #dc2626; font-weight: 650; }
    .reminder-link { display: grid; flex: 0 0 auto; place-items: center; width: 2.25rem; height: 2.25rem; margin-left: auto; border-radius: 50%; color: var(--text-secondary); text-decoration: none; }
    .reminder-link:hover { background: var(--surface-hover); color: var(--primary-color); }
    .agenda-state { display: grid; justify-items: center; gap: .5rem; padding: 2rem 1rem; color: var(--text-secondary); text-align: center; }
    .agenda-state > i, .agenda-empty > i { color: var(--primary-color); font-size: 1.6rem; }
    .agenda-state h2, .agenda-state p, .agenda-empty h3, .agenda-empty p { margin: 0; }
    .agenda-state h2, .agenda-empty h3 { color: var(--text-primary); font-size: 1rem; }
    .agenda-empty { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border: 1px solid var(--surface-border); border-radius: var(--radius-md); background: var(--surface-hover); }
    .agenda-empty > div { display: grid; gap: .25rem; }
    .agenda-empty p, .appointments-note p { color: var(--text-secondary); font-size: .875rem; line-height: 1.5; }
    .agenda-button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; width: fit-content; padding: .65rem .9rem; border: 1px solid var(--surface-border); border-radius: var(--radius-md); background: var(--surface-card); color: var(--text-primary); font: inherit; font-size: .85rem; font-weight: 650; text-decoration: none; cursor: pointer; }
    .agenda-button:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .appointments-note { display: flex; align-items: center; gap: .9rem; margin-top: 1rem; padding: 1rem 1.25rem; background: var(--surface-hover); }
    .appointments-note-icon { display: grid; flex: 0 0 auto; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: .8rem; background: var(--surface-hover); color: var(--primary-color); }
    .appointments-note h2 { margin: 0; color: var(--text-primary); font-size: .95rem; }
    .appointments-note p { margin: .25rem 0 0; }
    .appointments-note > a { margin-left: auto; color: var(--primary-color); font-size: .85rem; font-weight: 650; text-decoration: none; white-space: nowrap; }
    @media (max-width: 600px) {
      .agenda-empty { align-items: flex-start; flex-wrap: wrap; }
      .agenda-empty .agenda-button { margin-left: 3.6rem; }
      .appointments-note { align-items: flex-start; flex-wrap: wrap; }
      .appointments-note > a { margin-left: 3.4rem; }
      .card-body { padding: .75rem 1rem; }
    }
  `]
})
export class AgendaPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly petService = inject(PetService);

  readonly pets = signal<PetResponse[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly reminders = computed(() =>
    this.pets()
      .filter(pet => Boolean(pet.nextVaccinationDate))
      .sort((first, second) => this.dateTimestamp(first.nextVaccinationDate) - this.dateTimestamp(second.nextVaccinationDate))
  );

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    const user = this.authService.user();
    if (!user?.id) {
      this.loading.set(false);
      this.loadFailed.set(true);
      return;
    }

    this.loading.set(true);
    this.loadFailed.set(false);
    this.petService.getPetsByOwner(user.id).subscribe({
      next: pets => {
        this.pets.set(pets);
        this.loading.set(false);
      },
      error: () => {
        this.loadFailed.set(true);
        this.loading.set(false);
      }
    });
  }

  isOverdue(date: string | null): boolean {
    return Boolean(date) && this.dateTimestamp(date) < this.startOfToday();
  }

  private dateTimestamp(date: string | null): number {
    if (!date) return Number.MAX_SAFE_INTEGER;
    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date;
    const timestamp = new Date(normalizedDate).getTime();
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }

  private startOfToday(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }
}
