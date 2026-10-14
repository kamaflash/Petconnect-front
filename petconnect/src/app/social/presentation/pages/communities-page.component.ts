import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { CommunityFormDialogComponent } from '../components/community-form-dialog/community-form-dialog.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import {
  SocialService,
  CommunityDraft,
  CommunityResponse,
  COMMUNITY_TOPICS,
} from '../../infrastructure/services/social.service';

/**
 * Descubrimiento de círculos de comunidad.
 *
 * La lista es pública: el backend no exige sesión para leerla. Unirse, salir y
 * crear sí la exigen, y el identificador del usuario nunca viaja en la petición,
 * porque lo resuelve el servidor a partir del token.
 */
@Component({
  selector: 'app-communities-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule,
    InputTextModule,
    SkeletonModule,
    ChipModule,
    AvatarModule,
    ToastModule,
    TranslocoModule,
    PageHeadingCardComponent,
    CommunityFormDialogComponent,
  ],
  providers: [MessageService],
  template: `
    <app-page-heading-card
      [title]="t('social.communities.title')"
      [subtitle]="t('social.communities.subtitle')"
    ></app-page-heading-card>

    <p-toast />

    <section class="circles-toolbar">
      <span class="p-input-icon-left circles-search">
        <i class="pi pi-search"></i>
        <input
          pInputText
          type="text"
          class="w-full"
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearchTermChange($event)"
          (keydown)="onSearchKeyDown($event)"
          [placeholder]="t('social.communities.searchPlaceholder')"
          [attr.aria-label]="t('social.communities.searchPlaceholder')"
        />
      </span>

      <div class="circles-topics" role="group" [attr.aria-label]="t('social.communities.topicLabel')">
        <p-chip
          *ngFor="let topic of topics"
          [label]="topicLabel(topic)"
          [attr.aria-pressed]="activeTopic() === topic"
          [class.circles-topic-active]="activeTopic() === topic"
          (click)="toggleTopic(topic)"
        />
      </div>

      @if (loggedIn()) {
        <button
          pButton
          type="button"
          icon="pi pi-plus"
          class="p-button-outlined circles-create"
          [label]="t('social.communities.createButton')"
          [disabled]="saving"
          (click)="openCreate()"
        ></button>
      }
    </section>

    @if (loading()) {
      <div class="circles-grid" aria-busy="true">
        <p-card *ngFor="let s of skeletons" styleClass="circle-card">
          <ng-template pTemplate="content">
            <p-skeleton styleClass="mb-2" height="8rem" />
            <p-skeleton width="60%" styleClass="mb-2" />
            <p-skeleton width="90%" />
          </ng-template>
        </p-card>
      </div>
    } @else if (error()) {
      <p class="circles-empty">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        {{ t('social.communities.loadError') }}
      </p>
      <button pButton type="button" [label]="t('social.communities.retry')" (click)="load()"></button>
    } @else if (communities().length === 0) {
      <p class="circles-empty">
        <i class="pi pi-users" aria-hidden="true"></i>
        {{ t('social.communities.empty') }}
      </p>
    } @else {
      <div class="circles-grid">
        <p-card *ngFor="let circle of communities(); trackBy: trackById" styleClass="circle-card">
          <ng-template pTemplate="header">
            <a class="circle-head" [routerLink]="['/social/communities', circle.id]">
              <p-avatar
                [image]="circle.avatarUrl"
                [label]="circle.name.charAt(0)"
                size="large"
                shape="circle"
              />
              <div class="circle-heading-copy">
                <h2>{{ circle.name }}</h2>
                @if (circle.topic) {
                  <p-tag [value]="topicLabel(circle.topic)" severity="info" />
                }
              </div>
            </a>
          </ng-template>

          <p class="circle-description">{{ circle.description }}</p>

          <ng-template pTemplate="footer">
            <div class="circle-footer">
              <span class="circle-members">
                <i class="pi pi-users" aria-hidden="true"></i>
                {{ memberCountLabel(circle.membersCount) }}
              </span>
              <button
                pButton
                type="button"
                [icon]="circle.member ? 'pi pi-times' : 'pi pi-plus'"
                [label]="circle.member ? t('social.communities.leave') : t('social.communities.join')"
                [class.p-button-secondary]="circle.member"
                [loading]="pendingId() === circle.id"
                [disabled]="pendingId() !== null && pendingId() !== circle.id"
                (click)="toggleMembership(circle)"
              ></button>
            </div>
          </ng-template>
        </p-card>
      </div>
    }

    <app-community-form-dialog
      #formDialog
      (saved)="saveCommunity($event)"
    ></app-community-form-dialog>
  `,

  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .circles-toolbar {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin: 1rem 0 1.25rem;
      }
      .circles-search {
        width: 100%;
      }

      .circles-topics {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .circles-topics ::ng-deep .p-chip {
        cursor: pointer;
        user-select: none;
      }
      .circles-topic-active {
        outline: 2px solid var(--p-content-border-color, #c8c8c8);
      }

      /* El contenedor es columna, así que sin esto el botón se estira al 100%. */
      .circles-create {
        align-self: flex-start;
      }

      .circles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
        gap: 1rem;
      }

      .circle-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        text-decoration: none;
        color: inherit;
      }
      .circle-heading-copy {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
      }
      .circle-heading-copy h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .circle-description {
        margin: 0;
        color: var(--p-text-muted-color, #6b7280);
      }

      .circle-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .circle-members {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
        color: var(--p-text-muted-color, #6b7280);
      }

      .circles-empty {
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
export class CommunitiesPageComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);
  private readonly messageService = inject(MessageService);

  /** Círculos visibles; se reemplazan en cada recarga de la búsqueda. */
  readonly communities = signal<CommunityResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  /** Círculo con una petición de unirse/salir en curso, para el spinner. */
  readonly pendingId = signal<string | null>(null);
  readonly activeTopic = signal<string | null>(null);

  /**
   * Señal pública de sesión. Se expone porque el botón de crear se pinta en la
   * plantilla y `auth` es privado.
   */
  readonly loggedIn = this.auth.user;

  searchTerm = '';
  /** Evita pulsar guardar dos veces con la petición ya en vuelo. */
  saving = false;
  readonly topics: readonly string[] = COMMUNITY_TOPICS;
  readonly skeletons = [0, 1, 2, 3, 4, 5];

  @ViewChild('formDialog') formDialog?: CommunityFormDialogComponent;

  private readonly searchChanges = new Subject<string>();
  private searchSub?: Subscription;
  private querySub?: Subscription;
  /** Marca que hay que abrir el formulario una vez montada la vista. */
  private pendingCreate = false;

  ngOnInit(): void {
    this.searchSub = this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.load());
    this.load();

    // El botón "Crear grupo" de la home llega con ?crear=1. Se suscribe en lugar
    // de leer snapshot para que también funcione si el usuario ya está en la página.
    this.querySub = this.route.queryParamMap.subscribe((params) => {
      if (params.get('crear') !== '1') {
        return;
      }
      // Se retira el parámetro: así un F5 o el botón atrás no reabren el diálogo.
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { crear: null },
        replaceUrl: true,
      });

      if (this.formDialog) {
        this.openCreate();
      } else {
        // Todavía no existe el diálogo: se abre al terminar de montar la vista.
        this.pendingCreate = true;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.pendingCreate) {
      this.pendingCreate = false;
      this.openCreate();
    }
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.i18n.translate(key, params);
  }

  onSearchTermChange(value: string): void {
    this.searchChanges.next(value ?? '');
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.load();
    }
  }

  /** Activa o desactiva el filtro por tema y recarga la lista. */
  toggleTopic(topic: string): void {
    this.activeTopic.set(this.activeTopic() === topic ? null : topic);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.social
      .searchCommunities({
        q: this.searchTerm,
        topic: this.activeTopic() ?? undefined,
      })
      .subscribe({
        next: (page) => {
          this.communities.set(page?.content ?? []);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(this.t('social.communities.loadError'), err);
          this.error.set(err?.message ?? null);
          this.loading.set(false);
        },
      });
  }

  /**
   * Une o saca al usuario del círculo. Sin sesión solo se avisa: la petición
   * no se emite, porque el backend respondería 401.
   */
  toggleMembership(circle: CommunityResponse): void {
    if (this.pendingId()) {
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
    this.pendingId.set(circle.id);
    const request$ = wasMember
      ? this.social.leaveCommunity(circle.id)
      : this.social.joinCommunity(circle.id);

    request$.subscribe({
      next: (updated) => {
        this.pendingId.set(null);
        this.replaceCircle(updated);
        this.notify(
          'success',
          wasMember ? 'social.communities.leftTitle' : 'social.communities.joinedTitle',
          wasMember ? 'social.communities.left' : 'social.communities.joined'
        );
      },
      error: (err) => {
        this.pendingId.set(null);
        console.error(this.t('social.communities.membershipError'), err);
        this.notify(
          'error',
          'social.communities.membershipErrorTitle',
          'social.communities.membershipError'
        );
      },
    });
  }

  /** Abre el formulario en blanco. Solo llega con sesión iniciada. */
  openCreate(): void {
    if (!this.loggedIn()) {
      this.notify(
        'warn',
        'social.communities.loginRequiredTitle',
        'social.communities.loginRequired'
      );
      return;
    }
    this.formDialog?.open(null);
  }

  /**
   * Crea el círculo y recarga la lista. Se recarga entera en lugar de insertar
   * en memoria porque el orden del backend es por número de miembros y la
   * posición real de un círculo nuevo no la decide el cliente.
   */
  saveCommunity(draft: CommunityDraft): void {
    if (this.saving) {
      return;
    }
    this.saving = true;
    if (this.formDialog) {
      this.formDialog.saving = true;
    }

    this.social.createCommunity(draft).subscribe({
      next: (created) => {
        this.saving = false;
        if (this.formDialog) {
          this.formDialog.saving = false;
          this.formDialog.close();
        }
        this.notify('success', 'social.communities.createdTitle', 'social.communities.created');
        // El nuevo círculo se coloca el primero y se recarga el servidor por debajo.
        this.communities.update((list) =>
          list.some((c) => c.id === created.id) ? list : [created, ...list]
        );
        this.load();
      },
      error: (err) => {
        this.saving = false;
        // El diálogo se queda abierto para no perder lo escrito.
        if (this.formDialog) {
          this.formDialog.saving = false;
        }
        console.error(this.t('social.communities.saveError'), err);
        this.notify('error', 'social.communities.saveErrorTitle', 'social.communities.saveError');
      },
    });
  }

  topicLabel(topic: string | null): string {
    return topic ? this.t(`social.communities.topics.${topic}`) : '';
  }

  memberCountLabel(count: number): string {
    return this.t('social.communities.membersCount', { count });
  }

  trackById(_index: number, circle: CommunityResponse): string {
    return circle.id;
  }

  private replaceCircle(updated: CommunityResponse): void {
    this.communities.update((list) =>
      list.map((circle) => (circle.id === updated.id ? updated : circle))
    );
  }

  private notify(severity: string, titleKey: string, detailKey: string): void {
    this.messageService.add({
      severity,
      summary: this.t(titleKey),
      detail: this.t(detailKey),
    });
  }
}


