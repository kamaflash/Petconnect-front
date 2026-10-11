import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { PetPassport } from '../../domain/pet-care.model';
import { PetCareService } from '../../infrastructure/services/pet-care.service';

@Component({
  selector: 'app-public-pet-passport-page',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <main class="passport-shell">
      <section class="passport-card" *ngIf="loading()" aria-busy="true">
        <i class="pi pi-spin pi-spinner"></i><p>{{ 'petCare.loading' | transloco }}</p>
      </section>
      <section class="passport-card error-card" *ngIf="!loading() && error()">
        <i class="pi pi-lock"></i>
        <h1>{{ 'petCare.publicUnavailable' | transloco }}</h1>
        <p>{{ 'petCare.publicUnavailableHelp' | transloco }}</p>
      </section>
      <ng-container *ngIf="!loading() && passport() as record">
        <header class="passport-heading">
          <img *ngIf="record.avatarUrl" [src]="record.avatarUrl" [alt]="record.petName">
          <span *ngIf="!record.avatarUrl" class="pet-placeholder"><i class="pi pi-paw"></i></span>
          <div><p>{{ 'petCare.passportLabel' | transloco }}</p><h1>{{ record.petName }}</h1><span>{{ record.species }}<ng-container *ngIf="record.breed"> · {{ record.breed }}</ng-container></span></div>
        </header>
        <section class="passport-card">
          <h2><i class="pi pi-heart"></i> {{ 'petCare.medicalInfo' | transloco }}</h2>
          <dl>
            <ng-container *ngIf="record.bloodType"><dt>{{ 'petCare.bloodType' | transloco }}</dt><dd>{{ record.bloodType }}</dd></ng-container>
            <ng-container *ngIf="record.allergies"><dt>{{ 'petCare.allergies' | transloco }}</dt><dd>{{ record.allergies }}</dd></ng-container>
            <ng-container *ngIf="record.medicalConditions"><dt>{{ 'petCare.conditions' | transloco }}</dt><dd>{{ record.medicalConditions }}</dd></ng-container>
          </dl>
          <p class="empty" *ngIf="!record.bloodType && !record.allergies && !record.medicalConditions">{{ 'petCare.noSharedMedical' | transloco }}</p>
        </section>
        <section class="passport-card" *ngIf="record.emergencyContact || record.emergencyPhone">
          <h2><i class="pi pi-phone"></i> {{ 'petCare.emergencyInfo' | transloco }}</h2>
          <p>{{ record.emergencyContact }}</p>
          <a *ngIf="record.emergencyPhone" [href]="'tel:' + record.emergencyPhone">{{ record.emergencyPhone }}</a>
        </section>
        <section class="passport-card" *ngIf="record.vetName || record.vetPhone || record.vetAddress">
          <h2><i class="pi pi-briefcase"></i> {{ 'petCare.vetInfo' | transloco }}</h2>
          <p>{{ record.vetName }}</p>
          <a *ngIf="record.vetPhone" [href]="'tel:' + record.vetPhone">{{ record.vetPhone }}</a>
          <p>{{ record.vetAddress }}</p>
        </section>
        <footer>{{ 'petCare.passportFooter' | transloco }}</footer>
      </ng-container>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--surface-bg); color: var(--text-primary); padding: 2rem 1rem; }
    .passport-shell { width: min(100%, 680px); margin: 0 auto; display: grid; gap: 1rem; }
    .passport-heading, .passport-card { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--radius-lg); padding: 1.25rem; }
    .passport-heading { display: flex; align-items: center; gap: 1rem; }
    .passport-heading img, .pet-placeholder { width: 5rem; height: 5rem; border-radius: 50%; object-fit: cover; background: var(--surface-hover); display: grid; place-items: center; flex: 0 0 auto; }
    .pet-placeholder { font-size: 1.5rem; }
    .passport-heading p, .passport-heading h1 { margin: 0 0 .25rem; }
    .passport-heading p, .passport-heading span, .empty, footer { color: var(--text-secondary); }
    .passport-card h2 { font-size: 1.05rem; display: flex; gap: .6rem; align-items: center; margin: 0 0 1rem; }
    dl { display: grid; grid-template-columns: minmax(120px, .5fr) 1fr; gap: .6rem 1rem; margin: 0; }
    dt { color: var(--text-secondary); } dd { margin: 0; overflow-wrap: anywhere; }
    .passport-card p { overflow-wrap: anywhere; }
    .error-card { text-align: center; padding: 3rem 1.5rem; }
    .error-card > i { font-size: 2rem; }
    .error-card h1 { font-size: 1.25rem; }
    .loading { text-align: center; }
    footer { text-align: center; font-size: .85rem; padding: .5rem; }
    @media (max-width: 480px) { :host { padding: 1rem .75rem; } .passport-heading, .passport-card { padding: 1rem; } }
  `]
})
export class PublicPetPassportPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly careService = inject(PetCareService);
  readonly passport = signal<PetPassport | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.careService.getPublicPassport(token).subscribe({
      next: record => {
        this.passport.set(record);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
