import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Component, computed, inject, input, output, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

export interface TableCardItem {
  id: string;
  name: string;
  avatar: string;
  description?: string;
  rating?: number;
  reviews?: number;
  tags?: string[];
  location?: string;
  userId?: string;
  image?: string;
  images?: string[];
  likesCount?: number;
  commentsCount?: number;
  timeAgo?: string;
  date?: string;
  membersCount?: number;
  isPublic?: boolean;
  species?: string;
  breed?: string;
  gender?: string;
  dateOfBirth?: string;
  petSubtitle?: string;
  petStatus?: string;
  petStatusWarning?: boolean;
  petDetails?: string[];
  careLabel?: string;
  careDate?: string | null;
  careOverdue?: boolean;
  familyCard?: boolean;
  duration?: number;
  seen?: boolean;
  [key: string]: any;
}

export type CardType = 'post' | 'pet' | 'event' | 'story' | 'group' | 'service' | 'product';

@Component({
  selector: 'app-table-card',
  standalone: true,
  imports: [TranslocoModule, 
    CommonModule,
    ButtonModule,
    AvatarModule,
    InputTextModule,
    FormsModule,
    RouterLink,
    SkeletonModule,
    TagModule,
  ],
  template: `
    <div class="feed-container">
      <!-- Header con búsqueda -->
      @if (showSearch()) {
        <div class="feed-header">
          <div class="search-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              pInputText
              [placeholder]="this.i18n.translate('tableCard.search')"
              class="search-input"
              [ngModelOptions]="{standalone: true}"
              [(ngModel)]="searchValue"
              (ngModelChange)="searchChange.emit($event)"
            />
            @if (searchValue()) {
              <button type="button" class="clear-button" (click)="clearSearch()">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>
        </div>
      }

      <div class="feed-list">
        @if (loading()) {
          <!-- Loading skeletons -->
          @if (type() === 'post') {
            @for (i of [1, 2, 3]; track i) {
              <div class="feed-post skeleton-post">
                <div class="post-header">
                  <p-skeleton shape="circle" size="2.5rem" />
                  <div class="post-user-info">
                    <p-skeleton width="8rem" height="0.875rem" styleClass="mb-1" />
                    <p-skeleton width="5rem" height="0.75rem" />
                  </div>
                </div>
                <p-skeleton width="100%" height="200px" styleClass="mt-2" />
                <div class="post-actions-skeleton"><p-skeleton width="6rem" height="1.5rem" /></div>
                <p-skeleton width="60%" height="0.75rem" styleClass="mt-2" />
                <p-skeleton width="40%" height="0.75rem" styleClass="mt-1" />
              </div>
            }
          } @else {
            <div class="skeleton-grid">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="skeleton-card-item">
                  <p-skeleton width="100%" height="160px" />
                  <p-skeleton width="70%" height="1rem" styleClass="mt-2" />
                  <p-skeleton width="50%" height="0.875rem" styleClass="mt-1" />
                </div>
              }
            </div>
          }
        } @else {
          <ng-template #addCard>
            @if (editable()) {
              <button type="button" class="add-card" (click)="onAdd.emit()">
                <span class="add-card-content">
                  <i class="pi pi-plus add-icon" aria-hidden="true"></i>
                  <span class="add-label">{{ addLabel() }}</span>
                </span>
              </button>
            }
          </ng-template>
          @if (type() === 'service') {
            <ng-container *ngTemplateOutlet="addCard"></ng-container>
          }

          @switch (type()) {
            @case ('post') {
              <div class="posts-grid-instagram">
                <ng-container *ngTemplateOutlet="addCard"></ng-container>
                @for (item of filteredItems(); track item.id) {
                  <div class="post-card-instagram">
                    <img [src]="item.image" alt="Post" class="post-image-instagram" />
                    <div class="post-overlay-instagram">
                      <span><i class="pi pi-heart"></i> {{ item['likes'] ?? item.likesCount ?? 0 }}</span>
                      <span><i class="pi pi-comment"></i> {{ item['comments'] ?? item.commentsCount ?? 0 }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            @case ('pet') {
              <div class="card-grid">
                <ng-container *ngTemplateOutlet="addCard"></ng-container>
                @for (item of filteredItems(); track item.id; let idx = $index) {
                  <div class="card-item pet-card" [class.family-pet-card]="item.familyCard" (click)="onPetClick(item)">
                    <div class="card-actions-top">
                      <ng-content select="[card-actions]"></ng-content>
                    </div>
                    <div
                      class="pet-image-section"
                      [style.background-image]="'url(' + getPetImage(item, idx) + ')'"
                    >
                      <div class="pet-image-overlay"></div>
                      @if (item.petStatus) {
                        <span class="pet-status-badge" [class.warning]="item.petStatusWarning">{{ item.petStatus }}</span>
                      }
                      @if (getPetImageCount(item) > 1) {
                        <button class="carousel-btn carousel-prev" (click)="prevPetImage($event, idx, item)">
                          <span class="material-symbols-rounded">chevron_left</span>
                        </button>
                        <button class="carousel-btn carousel-next" (click)="nextPetImage($event, idx, item)">
                          <span class="material-symbols-rounded">chevron_right</span>
                        </button>
                        <div class="carousel-dots">
                          @for (dot of getPetImages(item); track $index) {
                            <span
                              class="carousel-dot"
                              [class.active]="$index === getPetImageIndex(idx)"
                              (click)="goToPetImage($event, idx, $index)"
                            ></span>
                          }
                        </div>
                      }
                    </div>
                    <div class="pet-info-footer">
                      <div class="pet-name">{{ item.name }}</div>
                      @if (item.petSubtitle) {
                        <div class="pet-stat pet-subtitle">{{ item.petSubtitle }}</div>
                      }
                      @if (item.petDetails?.length) {
                        <div class="pet-stats">
                          @for (detail of item.petDetails; track detail) {
                            <span class="pet-stat">{{ detail }}</span>
                          }
                        </div>
                      }
                      @if (item.careLabel) {
                        <div class="pet-care" [class.overdue]="item.careOverdue">
                          <i class="pi pi-calendar" aria-hidden="true"></i>
                          <span>{{ item.careLabel }}</span>
                          @if (item.careDate) {
                            <time [attr.datetime]="item.careDate">{{ item.careDate | date:'mediumDate' }}</time>
                          }
                        </div>
                      }
                      @if (!item.familyCard) {
                      <div class="pet-stats">
                        <span class="pet-stat"><span class="material-symbols-rounded stat-icon">favorite</span> {{ item.likesCount ?? 0 }}</span>
                        <span class="pet-stat"><span class="material-symbols-rounded stat-icon">share</span> {{ item.commentsCount ?? 0 }}</span>
                      </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @case ('event') {
              <div class="card-grid">
                <ng-container *ngTemplateOutlet="addCard"></ng-container>
                @for (item of filteredItems(); track item.id) {
                  <div class="card-item event-card">
                    <div class="card-actions-top">
                      <ng-content select="[card-actions]"></ng-content>
                    </div>
                    @if (item.image) {
                      <div class="event-image-wrapper">
                        <img [src]="item.image" [alt]="item.name" class="event-image" />
                      </div>
                    }
                    <div class="event-body">
                      @if (item.date) {
                        <div class="event-date-badge">
                          <span class="event-date-day">{{ getDay(item.date) }}</span>
                          <span class="event-date-month">{{ getMonth(item.date) }}</span>
                        </div>
                      }
                      <div class="event-info">
                        <div class="event-title">{{ item.name }}</div>
                        @if (item.location) {
                          <div class="event-location"><i class="pi pi-map-marker"></i> {{ item.location }}</div>
                        }
                        @if (item.description) {
                          <div class="event-description">{{ item.description }}</div>
                        }
                      </div>
                    </div>
                    @if (item.tags && item.tags.length > 0) {
                      <div class="event-tags">
                        @for (tag of item.tags; track tag) {
                          <p-tag [value]="tag" styleClass="p-tag-sm" />
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }

            @case ('story') {
              <div class="stories-row">
                <ng-container *ngTemplateOutlet="addCard"></ng-container>
                @for (item of filteredItems(); track item.id) {
                  <div class="story-item" [class.seen]="item.seen">
                    <div class="card-actions-top story-actions">
                      <ng-content select="[card-actions]"></ng-content>
                    </div>
                    <div class="story-ring" [class.unseen]="!item.seen">
                      <div class="story-avatar-wrapper">
                        @if (item.image) {
                          <img [src]="item.image" class="story-image" />
                        } @else {
                          <p-avatar [image]="item.avatar" shape="circle" size="xlarge"></p-avatar>
                        }
                      </div>
                    </div>
                    <div class="story-name">{{ item.name }}</div>
                    @if (item.duration) {
                      <div class="story-duration">{{ item.duration }}h</div>
                    }
                  </div>
                }
              </div>
            }

            @case ('group') {
              <div class="card-grid">
                <ng-container *ngTemplateOutlet="addCard"></ng-container>
                @for (item of filteredItems(); track item.id) {
                  <div class="card-item group-card">
                    <div class="card-actions-top">
                      <ng-content select="[card-actions]"></ng-content>
                    </div>
                    <div class="group-avatar-wrapper">
                      <p-avatar [image]="item.avatar" shape="circle" size="xlarge"></p-avatar>
                    </div>
                    <div class="group-name">{{ item.name }}</div>
                    @if (item.description) {
                      <div class="group-description">{{ item.description }}</div>
                    }
                    <div class="group-meta">
                      @if (item.membersCount !== undefined) {
                        <span class="group-members"><i class="pi pi-users"></i> {{ item.membersCount }} miembros</span>
                      }
                      @if (item.isPublic !== undefined) {
                        <p-tag
                          [value]="item.isPublic ? 'Público' : 'Privado'"
                          [severity]="item.isPublic ? 'info' : 'warn'"
                          styleClass="p-tag-sm"
                        />
                      }
                    </div>
                    @if (item.tags && item.tags.length > 0) {
                      <div class="group-tags">
                        @for (tag of item.tags; track tag) {
                          <p-tag [value]="tag" styleClass="p-tag-sm" />
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }

            @case ('product') {
              <div class="product-grid">
                <ng-container *ngTemplateOutlet="addCard"></ng-container>
                @for (item of filteredItems(); track item.id) {
                  <div class="product-card">
                    <div class="card-actions-top">
                      <ng-content select="[card-actions]"></ng-content>
                    </div>
                    @if (item.avatar) {
                      <div class="product-image-container">
                        <img [src]="item.avatar" [alt]="item.name" class="product-image" />
                      </div>
                    }
                    <div class="product-content">
                      <div class="product-name">{{ item.name }}</div>
                      @if (item.description) {
                        <div class="product-description">{{ item.description }}</div>
                      }
                      @if (item.tags && item.tags.length > 0) {
                        <div class="product-tags">
                          @for (tag of item.tags; track tag) {
                            <p-tag [value]="tag" styleClass="p-tag-sm" />
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .feed-container {
      // max-width: 600px;
      margin: 0 auto;
    }

    /* ===== SEARCH ===== */
    .feed-header { margin-bottom: 1rem; }
    .search-wrapper { position: relative; width: 100%; }
    .search-icon {
      position: absolute; left: 0.75rem; top: 50%;
      transform: translateY(-50%);
      color: var(--bitbucket-text-secondary); z-index: 1; font-size: 0.875rem;
    }
    .search-input {
      width: 100%; padding-left: 2.5rem; border-radius: 0.5rem;
      background-color: var(--bitbucket-bg-secondary, #f5f5f5);
      border: 1px solid transparent; transition: all 0.2s;
    }
    .search-input:focus { border-color: var(--bitbucket-border); background-color: var(--bitbucket-header-bg); }
    .clear-button {
      position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--bitbucket-text-secondary);
      cursor: pointer; padding: 0.25rem;
    }

    /* ===== FEED LIST ===== */
    .feed-list { display: flex; flex-direction: column; gap: 1rem; }

    /* ===== ADD CARD ===== */
    .add-card {
      background-color: var(--bitbucket-header-bg);
      border: 2px dashed var(--bitbucket-border); border-radius: 0.5rem;
      padding: 1.5rem; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s ease; min-height: 100px;
    }
    .add-card:hover { border-color: var(--primary-color); background-color: rgba(148, 199, 72, 0.03); }
    .add-card-content { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .add-icon { font-size: 2rem; color: var(--bitbucket-text-secondary); transition: color 0.3s ease; }
    .add-card:hover .add-icon { color: var(--primary-color); }
    .add-label { font-size: 0.875rem; font-weight: 500; color: var(--bitbucket-text-secondary); transition: color 0.3s ease; }
    .add-card:hover .add-label { color: var(--primary-color); }

    /* ===== CARD GRID (pets, events, groups) ===== */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    .card-item {
      background-color: var(--bitbucket-header-bg);
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.75rem;
      overflow: hidden;
      transition: box-shadow 0.2s, transform 0.2s;
      position: relative;
    }
    .card-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }
    .dark .card-item { border-color: rgba(255,255,255,0.1); }

    .card-actions-top {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 3;
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .card-item:hover .card-actions-top { opacity: 1; }

    /* ===== POST TYPE ===== */
    .feed-post {
      background-color: var(--bitbucket-header-bg);
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.5rem;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .feed-post:hover { box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .dark .feed-post { border-color: rgba(255,255,255,0.1); }

    .post-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }
    .post-user { display: flex; align-items: center; gap: 0.75rem; }
    .post-user-info { display: flex; flex-direction: column; }
    .post-username { font-weight: 600; font-size: 0.875rem; color: var(--bitbucket-text-primary); text-decoration: none; line-height: 1.2; }
    .post-username:hover { text-decoration: underline; }
    .post-location { font-size: 0.75rem; color: var(--bitbucket-text-secondary); line-height: 1.2; }
    .post-actions-trigger { display: flex; gap: 0.25rem; }

    .post-image-wrapper { width: 100%; background-color: var(--bitbucket-bg-secondary, #f0f0f0); }
    .post-image { width: 100%; height: auto; max-height: 500px; object-fit: cover; display: block; }
    .post-image-placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background-color: var(--bitbucket-bg-secondary, #f0f0f0); color: var(--bitbucket-text-secondary); font-size: 2rem; }

    .post-actions-bar { display: flex; align-items: center; gap: 0.25rem; padding: 0.5rem 1rem 0.25rem; }
    .action-btn { background: none; border: none; cursor: pointer; padding: 0.375rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--bitbucket-text-primary); transition: all 0.2s; font-size: 1.25rem; }
    .action-btn:hover { background-color: var(--bitbucket-bg-hover); }

    .post-likes { padding: 0 1rem; }
    .likes-count { font-weight: 600; font-size: 0.875rem; color: var(--bitbucket-text-primary); }
    .post-caption { padding: 0.25rem 1rem; font-size: 0.875rem; line-height: 1.4; }
    .caption-username { font-weight: 600; color: var(--bitbucket-text-primary); margin-right: 0.375rem; }
    .caption-text { color: var(--bitbucket-text-primary); }
    .post-tags { padding: 0.25rem 1rem; display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .post-tag { font-size: 0.8125rem; color: var(--primary-color, #f97316); cursor: pointer; }
    .post-tag:hover { text-decoration: underline; }
    .post-comments-link { padding: 0.25rem 1rem; }
    .post-comments-link span { font-size: 0.8125rem; color: var(--bitbucket-text-secondary); cursor: pointer; }
    .post-comments-link span:hover { text-decoration: underline; }
    .post-time { padding: 0.25rem 1rem 0.75rem; }
    .post-time span { font-size: 0.6875rem; color: var(--bitbucket-text-secondary); text-transform: uppercase; letter-spacing: 0.02em; }

    /* ===== PET TYPE ===== */
    .pet-card {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
      border: none;
      min-height: 280px;
      cursor: pointer;
    }
    .pet-image-section {
      flex: 1;
      min-height: 180px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-image 0.3s ease;
    }
    .pet-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
      z-index: 0;
    }
    .pet-info-footer {
      padding: 0.75rem 1rem 1rem;
      text-align: center;
      background-color: var(--bitbucket-header-bg);
    }
    .pet-name {
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--bitbucket-text-primary);
      margin-bottom: 0.375rem;
    }
    .pet-stats {
      display: flex;
      justify-content: center;
      gap: 1.25rem;
    }
    .pet-care.overdue { color: #a63131; }
    .pet-status-badge { position: absolute; top: .75rem; left: .75rem; z-index: 2; padding: .3rem .625rem; border-radius: 999px; background: #e8f6ed; color: #216b3c; }
    .pet-status-badge.warning { background: #fff2dd; color: #8a4b08; }
    .family-pet-card .card-actions-top { opacity: 1; }
    .pet-stat {
      font-size: 0.8125rem;
      color: var(--bitbucket-text-secondary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .stat-icon {
      font-size: 1.125rem;
      color: var(--bitbucket-text-secondary);
      font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
    }

    /* ===== CAROUSEL ===== */
    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      background: rgba(255,255,255,0.7);
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s, background 0.2s;
      color: #333;
    }
    .carousel-btn:hover { background: rgba(255,255,255,0.95); }
    .pet-image-section:hover .carousel-btn { opacity: 1; }
    .carousel-prev { left: 0.5rem; }
    .carousel-next { right: 0.5rem; }
    .carousel-btn .material-symbols-rounded {
      font-size: 1.25rem;
      font-variation-settings: 'FILL' 0, 'wght' 400;
    }
    .carousel-dots {
      position: absolute;
      bottom: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      display: flex;
      gap: 0.375rem;
    }
    .carousel-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.5);
      cursor: pointer;
      transition: background 0.2s, width 0.2s;
    }
    .carousel-dot.active {
      background: #fff;
      width: 18px;
      border-radius: 3px;
    }
    .carousel-dot:hover { background: rgba(255,255,255,0.8); }

    /* ===== EVENT TYPE ===== */
    .event-card { }
    .event-image-wrapper { width: 100%; max-height: 180px; overflow: hidden; }
    .event-image { width: 100%; height: 100%; object-fit: cover; display: block; }
    .event-body { padding: 1rem; display: flex; gap: 0.75rem; }
    .event-date-badge {
      display: flex; flex-direction: column; align-items: center;
      min-width: 48px; padding: 0.5rem; border-radius: 0.5rem;
      background-color: var(--bitbucket-bg-secondary, #f5f5f5);
      text-align: center;
    }
    .event-date-day { font-size: 1.25rem; font-weight: 700; color: var(--bitbucket-text-primary); line-height: 1; }
    .event-date-month { font-size: 0.6875rem; color: var(--bitbucket-text-secondary); text-transform: uppercase; }
    .event-info { flex: 1; min-width: 0; }
    .event-title { font-weight: 600; font-size: 1rem; color: var(--bitbucket-text-primary); margin-bottom: 0.25rem; }
    .event-location { font-size: 0.8125rem; color: var(--bitbucket-text-secondary); margin-bottom: 0.375rem; display: flex; align-items: center; gap: 0.25rem; }
    .event-location i { font-size: 0.75rem; }
    .event-description { font-size: 0.8125rem; color: var(--bitbucket-text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .event-tags { padding: 0 1rem 0.75rem; display: flex; gap: 0.25rem; flex-wrap: wrap; }

    /* ===== STORY TYPE ===== */
    .stories-row {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding: 0.5rem 0;
      scrollbar-width: none;
    }
    .stories-row::-webkit-scrollbar { display: none; }
    .story-item {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.375rem; cursor: pointer; position: relative;
      min-width: 80px;
    }
    .story-actions { position: absolute; top: -0.25rem; right: -0.25rem; }
    .story-ring {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    .story-ring.unseen {
      background: conic-gradient(var(--primary-color, #f97316) 0deg 360deg, transparent 360deg);
      padding: 3px;
    }
    .story-ring.unseen:hover { transform: scale(1.05); }
    .story-avatar-wrapper {
      width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
      background-color: var(--bitbucket-header-bg);
      display: flex; align-items: center; justify-content: center;
    }
    .story-image { width: 100%; height: 100%; object-fit: cover; }
    .story-name { font-size: 0.75rem; color: var(--bitbucket-text-primary); text-align: center; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .story-duration { font-size: 0.625rem; color: var(--bitbucket-text-secondary); }
    .story-item.seen .story-ring { background: none; border: 2px solid var(--bitbucket-border); padding: 2px; }
    .story-item.seen .story-avatar-wrapper { border: 2px solid var(--bitbucket-header-bg); }

    /* ===== GROUP TYPE ===== */
    .group-card { padding: 1.5rem 1rem; text-align: center; }
    .group-avatar-wrapper { margin-bottom: 0.75rem; }
    .group-name { font-weight: 700; font-size: 1.125rem; color: var(--bitbucket-text-primary); margin-bottom: 0.5rem; }
    .group-description { font-size: 0.8125rem; color: var(--bitbucket-text-secondary); line-height: 1.4; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .group-meta { display: flex; justify-content: center; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .group-members { font-size: 0.8125rem; color: var(--bitbucket-text-secondary); display: flex; align-items: center; gap: 0.375rem; }
    .group-members i { font-size: 0.875rem; }
    .group-tags { display: flex; justify-content: center; gap: 0.25rem; flex-wrap: wrap; }

    /* ===== SKELETON ===== */
    .skeleton-post { padding: 0; pointer-events: none; }
    .skeleton-post .post-header { padding: 0.75rem 1rem; }
    .post-actions-skeleton { padding: 0.5rem 1rem; }
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    .skeleton-card-item {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.75rem;
      padding: 1rem;
      pointer-events: none;
    }

    /* ===== POST INSTAGRAM TYPE ===== */
    .post-card-instagram {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .post-image-instagram {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-card-instagram:hover .post-image-instagram {
      transform: scale(1.05);
    }

    .post-overlay-instagram {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: white;
    }

    .post-card-instagram:hover .post-overlay-instagram {
      opacity: 1;
    }

    .post-overlay-instagram span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
    }

    /* ===== POST INSTAGRAM GRID ===== */
    .posts-grid-instagram {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    @media (max-width: 768px) {
      .posts-grid-instagram {
        grid-template-columns: 1fr;
      }
    }

    /* ===== PRODUCT TYPE (PetFeedGrid style) ===== */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: var(--bitbucket-header-bg);
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.5rem;
      overflow: hidden;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .dark .product-card { border-color: rgba(255,255,255,0.1); }

    .product-card .card-actions-top {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 3;
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .product-card:hover .card-actions-top { opacity: 1; }

    .product-image-container {
      position: relative;
      width: 100%;
      height: 250px;
      overflow: hidden;
      background: var(--bitbucket-bg-secondary, #f5f5f5);
    }
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .product-card:hover .product-image {
      transform: scale(1.05);
    }

    .product-content {
      padding: 1.25rem;
    }
    .product-name {
      font-weight: 600;
      font-size: 1rem;
      color: var(--bitbucket-text-primary);
      margin-bottom: 0.5rem;
    }
    .product-description {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }
    .product-tags {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }
  `]
})
export class TableCardComponent implements AfterViewInit, OnDestroy {
  readonly i18n = inject(TranslocoService);
  items = input<TableCardItem[]>([]);
  filters = input<{ label: string; value: string }[]>([]);
  showSearch = input(true);
  activeFilter = input('all');
  filteredItems = input<TableCardItem[]>([]);
  editable = input(false);
  loading = input(false);
  hasMore = input(false);
  loadingMore = input(false);
  type = input<CardType>('post');
  addLabelText = input<string | undefined>();

  searchChange = output<string>();
  filterChange = output<string>();
  onAdd = output<void>();
  loadMore = output<void>();

  searchValue = signal('');

  private router = inject(Router);

  @ViewChild('sentinel') sentinel!: ElementRef;
  private observer: IntersectionObserver | null = null;

  /** Stores the current image index for each pet card by its position in the filtered list */
  petImageIndexes = signal<number[]>([]);

  addLabel = computed(() => {
    const customLabel = this.addLabelText();
    if (customLabel) return customLabel;

    const labels: Record<CardType, string> = {
      post: 'Nueva publicación',
      pet: 'Nueva mascota',
      event: 'Nuevo evento',
      story: 'Nueva historia',
      group: 'Nuevo grupo',
      service: 'Nuevo servicio',
      product: 'Nuevo producto'
    };
    return labels[this.type()];
  });

  clearSearch() {
    this.searchValue.set('');
    this.searchChange.emit('');
  }

  getDay(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.getDate().toString();
  }

  getMonth(dateStr: string): string {
    if (!dateStr) return '';
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    const d = new Date(dateStr);
    return months[d.getMonth()] || '';
  }

  getPetImages(item: TableCardItem): string[] {
    return item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : [item.avatar]);
  }

  getPetImageCount(item: TableCardItem): number {
    return this.getPetImages(item).length;
  }

  getPetImage(item: TableCardItem, idx: number): string {
    const images = this.getPetImages(item);
    const currentIdx = this.petImageIndexes()[idx] ?? 0;
    return images[Math.min(currentIdx, images.length - 1)];
  }

  getPetImageIndex(idx: number): number {
    return this.petImageIndexes()[idx] ?? 0;
  }

  private ensureIndex(idx: number): void {
    const current = [...this.petImageIndexes()];
    if (current[idx] === undefined) {
      current[idx] = 0;
      this.petImageIndexes.set(current);
    }
  }

  nextPetImage(event: MouseEvent, idx: number, item: TableCardItem): void {
    event.stopPropagation();
    const total = this.getPetImageCount(item);
    this.ensureIndex(idx);
    const current = [...this.petImageIndexes()];
    current[idx] = (current[idx] + 1) % total;
    this.petImageIndexes.set(current);
  }

  prevPetImage(event: MouseEvent, idx: number, item: TableCardItem): void {
    event.stopPropagation();
    const total = this.getPetImageCount(item);
    this.ensureIndex(idx);
    const current = [...this.petImageIndexes()];
    current[idx] = (current[idx] - 1 + total) % total;
    this.petImageIndexes.set(current);
  }

  goToPetImage(event: MouseEvent, idx: number, imageIndex: number): void {
    event.stopPropagation();
    const current = [...this.petImageIndexes()];
    current[idx] = imageIndex;
    this.petImageIndexes.set(current);
  }

  onPetClick(item: TableCardItem): void {
    if (item.id) {
      this.router.navigate(['/profile/pet', item.id]);
    }
  }

  ngAfterViewInit(): void {
    this.initInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private initInfiniteScroll(): void {
    if (!this.sentinel) return;
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMore() && !this.loadingMore()) {
          this.loadMore.emit();
        }
      });
    });
    this.observer.observe(this.sentinel.nativeElement);
  }
}
