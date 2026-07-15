import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { RouterLink } from '@angular/router';
import { HomeService, PostResponse, UserProfileResponse, StoryResponse, SuggestionResponse, MarketplacePromoResponse, VetServiceResponse, AdoptionResponse, AchievementResponse, UserLevelResponse } from '../../infrastructure/services/home.service';
import { Story, Post, Suggestion, PromoItem, User, VetService, Adoption, Achievement, UserLevel } from '../../infrastructure/models/home.models';
import { finalize, catchError } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    AvatarGroupModule,
    InputTextModule,
    ProgressBarModule,
    RouterLink,
  ],
  template: `
    <div class="home-page">
      <div class="home-container">
        <!-- Columna Izquierda - Sidebar -->
        <div class="left-column">
          <!-- Anuncios de Mercado -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-shopping-cart card-header-icon"></i>
              <span class="card-header-title">Mercado</span>
            </div>
            <div class="card-body">
              <div class="promo-item" *ngFor="let promo of marketPromos">
                <img [src]="promo.image" [alt]="promo.title" class="promo-image" />
                <div class="promo-content">
                  <p class="promo-title">{{ promo.title }}</p>
                  <p class="promo-desc">{{ promo.description }}</p>
                  <p-tag *ngIf="promo.tag" [value]="promo.tag" severity="warn"></p-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- Servicios Veterinarios -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-user-md card-header-icon"></i>
              <span class="card-header-title">Veterinario</span>
            </div>
            <div class="card-body">
              <div class="service-item" *ngFor="let service of vetServices">
                <div class="service-icon">
                  <i class="pi" [class]="service.icon"></i>
                </div>
                <div class="service-info">
                  <p class="service-title">{{ service.title }}</p>
                  <p class="service-desc">{{ service.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Nuevas Adopciones -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-heart card-header-icon"></i>
              <span class="card-header-title">Adopciones</span>
            </div>
            <div class="card-body">
              <div class="adoption-item" *ngFor="let adoption of newAdoptions">
                <img [src]="adoption.image" [alt]="adoption.name" class="adoption-image" />
                <div class="adoption-info">
                  <p class="adoption-name">{{ adoption.name }}</p>
                  <p class="adoption-breed">{{ adoption.breed }}</p>
                  <p-button label="Conocer" [routerLink]="'/adoptions'" styleClass="p-button-sm p-button-outlined" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Central - Feed -->
        <div class="center-column">
          <!-- Stories -->
          <div class="stories-card">
            <div class="stories-scroll">
              <a class="story-item" *ngFor="let story of stories" [routerLink]="'/profile/' + story.user.userId">
                <div class="story-ring" [class.seen]="story.seen">
                  <p-avatar
                    [image]="story.user.avatar"
                    shape="circle"
                    size="large"
                  ></p-avatar>
                </div>
                <span class="story-name">{{ story.user.name }}</span>
              </a>
              <!-- <div class="story-item">
                <div class="story-ring story-add-ring">
                  <p-avatar
                    icon="pi pi-plus"
                    shape="circle"
                    size="large"
                    class="story-add-avatar"
                  ></p-avatar>
                </div>
                <span class="story-name">Tu historia</span>
              </div> -->
            </div>
          </div>

          <!-- Feed -->
          <div class="posts-feed">
            <div class="post-card" *ngFor="let post of posts">
              <!-- Header -->
              <div class="post-header">
                <div class="post-user">
                  <div class="post-avatar-ring">
                    <p-avatar
                      [image]="post.user.avatar"
                      shape="circle"
                      size="large"
                    ></p-avatar>
                  </div>
                  <div class="post-user-text">
                    <a [routerLink]="'/profile/' + post.user.userId" class="post-username">{{ post.user.username }}</a>
                    <span class="post-name">{{ post.user.name }}</span>
                  </div>
                </div>
                <button class="post-more-btn">
                  <i class="pi pi-ellipsis-h"></i>
                </button>
              </div>

              <!-- Image -->
              <div class="post-image-wrap">
                <img [src]="post.image" [alt]="post.caption" class="post-image" />
              </div>

              <!-- Actions -->
              <div class="post-actions">
                <div class="post-actions-left">
                  <button class="post-action-btn" (click)="toggleLike(post)">
                    <i class="pi" [class.pi-heart-fill]="post.liked" [class.pi-heart]="!post.liked"
                       [style.color]="post.liked ? 'var(--primary-color)' : ''"></i>
                  </button>
                  <button class="post-action-btn">
                    <i class="pi pi-comment"></i>
                  </button>
                  <button class="post-action-btn">
                    <i class="pi pi-send"></i>
                  </button>
                </div>
                <button class="post-action-btn" (click)="toggleSave(post)">
                  <i class="pi" [class.pi-bookmark-fill]="post.saved" [class.pi-bookmark]="!post.saved"></i>
                </button>
              </div>

              <!-- Likes -->
              <div class="post-likes">
                <p-avatar-group>
                  <p-avatar image="https://i.pravatar.cc/150?img=11" shape="circle" size="normal"></p-avatar>
                  <p-avatar image="https://i.pravatar.cc/150?img=12" shape="circle" size="normal"></p-avatar>
                  <p-avatar image="https://i.pravatar.cc/150?img=13" shape="circle" size="normal"></p-avatar>
                </p-avatar-group>
                <span class="likes-text">Le gusta a <strong>{{ post.likes }}</strong> personas</span>
              </div>

              <!-- Caption -->
              <div class="post-caption">
                <a [routerLink]="'/profile/' + post.user.userId" class="caption-user">{{ post.user.username }}</a>
                <span class="caption-text">{{ post.caption }}</span>
              </div>

              <!-- Comments -->
              <div class="post-comments">
                <span class="comments-link">Ver los {{ post.comments }} comentarios</span>
                <span class="comment-time">{{ post.timestamp | date:'d MMM' }}</span>
              </div>

              <!-- Comment Input -->
              <div class="post-comment-input">
                <input
                  type="text"
                  placeholder="Añade un comentario..."
                  class="comment-input"
                />
                <button class="comment-post-btn">Publicar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha -->
        <div class="right-column">
          <!-- Level Card -->
          <div class="level-card">
            <div class="level-top">
              <div class="level-text">
                <span class="level-label">Tu Nivel</span>
                <span class="level-number">Nivel 12</span>
              </div>
              <i class="pi pi-trophy level-icon"></i>
            </div>
            <div class="level-bar-wrap">
              <p-progressBar [value]="65" styleClass="level-progress-bar"></p-progressBar>
              <span class="level-xp">650 / 1000 XP</span>
            </div>
          </div>

          <!-- Achievements -->
          <div class="card-modern">
            <div class="card-header">
              <span class="card-header-title">Próximos Logros</span>
            </div>
            <div class="card-body">
              <div class="achievement-item" *ngFor="let achievement of upcomingAchievements">
                <div class="achievement-icon" [class.unlocked]="achievement.unlocked">
                  <i class="pi" [class]="achievement.icon"></i>
                </div>
                <div class="achievement-info">
                  <p class="achievement-name">{{ achievement.name }}</p>
                  <p class="achievement-desc">{{ achievement.description }}</p>
                  <div class="achievement-bar">
                    <p-progressBar [value]="(achievement.progress / achievement.total) * 100" styleClass="achievement-progress-bar"></p-progressBar>
                    <span class="achievement-count">{{ achievement.progress }} / {{ achievement.total }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Suggestions -->
          <div class="card-modern">
            <div class="card-header">
              <span class="card-header-title">Quién seguir</span>
            </div>
            <div class="card-body">
              <a class="suggestion-item" *ngFor="let suggestion of suggestions" [routerLink]="'/profile/' + suggestion.userId">
                <p-avatar [image]="suggestion.avatar" shape="circle" size="normal"></p-avatar>
                <div class="suggestion-info">
                  <span class="suggestion-name">{{ suggestion.username }}</span>
                  <span class="suggestion-followers">{{ suggestion.followers }} seguidores</span>
                </div>
                <p-button
                  label="Seguir"
                  styleClass="p-button-sm p-button-outlined"
                />
              </a>
            </div>
          </div>

          <!-- Trends -->
          <div class="card-modern">
            <div class="card-header">
              <span class="card-header-title">Tendencias</span>
            </div>
            <div class="card-body">
              <div class="trend-item">
                <span class="trend-category">Tendencia en Comunidad</span>
                <span class="trend-name">#PaseoPerruno</span>
                <span class="trend-posts">1.2k publicaciones</span>
              </div>
              <div class="trend-item">
                <span class="trend-category">Tendencia en Eventos</span>
                <span class="trend-name">#CarreraSolidaria</span>
                <span class="trend-posts">856 publicaciones</span>
              </div>
              <div class="trend-item">
                <span class="trend-category">Tendencia en Adopciones</span>
                <span class="trend-name">#HistoriasFelices</span>
                <span class="trend-posts">2.1k publicaciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== PAGE ===== */
    .home-page {
      min-height: 100vh;
      padding: 1.5rem 0;
    }

    .home-container {
      margin: 0 auto;
      display: grid;
      grid-template-columns: 300px 1fr 320px;
      max-width: 1280px;
      gap: 1.5rem;
      padding: 0 1.5rem;
    }

    /* ===== MODERN CARD ===== */
    .card-modern {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .card-header-icon {
      color: var(--text-secondary);
      font-size: 1.125rem;
    }

    .card-header-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .card-body {
      padding: 0.5rem 1.25rem;
    }

    /* ===== LEFT COLUMN ===== */
    .left-column {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .promo-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .promo-item:last-child { border-bottom: none; }

    .promo-image {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      flex-shrink: 0;
    }

    .promo-content { flex: 1; min-width: 0; }

    .promo-title {
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.125rem 0;
      font-size: 0.8125rem;
    }

    .promo-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0 0 0.25rem 0;
      line-height: 1.4;
    }

    /* Services */
    .service-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .service-item:last-child { border-bottom: none; }

    .service-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      background: var(--primary-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .service-info { flex: 1; min-width: 0; }

    .service-title {
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.125rem 0;
      font-size: 0.8125rem;
    }

    .service-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    /* Adoptions */
    .adoption-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
      align-items: center;
    }

    .adoption-item:last-child { border-bottom: none; }

    .adoption-image {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full);
      object-fit: cover;
      flex-shrink: 0;
      border: 2px solid var(--primary-color);
    }

    .adoption-info { flex: 1; min-width: 0; }

    .adoption-name {
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      font-size: 0.8125rem;
    }

    .adoption-breed {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0.125rem 0 0.375rem 0;
    }

    /* ===== CENTER COLUMN ===== */
    .center-column {
      min-width: 0;
    }

    /* Stories */
    .stories-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .stories-scroll {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding: 0.25rem 0;
      scrollbar-width: none;
    }

    .stories-scroll::-webkit-scrollbar { display: none; }

    .story-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
      flex-shrink: 0;
      text-decoration: none;
      min-width: 64px;
    }

    .story-ring {
      padding: 2px;
      border-radius: var(--radius-full);
      background: var(--instagram-gradient);
    }

    .story-ring.seen {
      background: var(--surface-border);
    }

    .story-ring :host ::ng-deep .p-avatar {
      border: 2px solid var(--surface-card);
    }

    .story-add-ring {
      background: var(--primary-color);
    }

    .story-add-avatar {
      background: transparent !important;
    }

    .story-name {
      font-size: 0.6875rem;
      color: var(--text-secondary);
      max-width: 64px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }

    /* Posts */
    .posts-feed {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .post-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
    }

    .post-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .post-avatar-ring {
      padding: 2px;
      border-radius: var(--radius-full);
      background: var(--instagram-gradient);
    }

    .post-avatar-ring :host ::ng-deep .p-avatar {
      border: 2px solid var(--surface-card);
    }

    .post-user-text {
      display: flex;
      flex-direction: column;
    }

    .post-username {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.8125rem;
      text-decoration: none;
      line-height: 1.3;
    }

    .post-username:hover {
      text-decoration: underline;
    }

    .post-name {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .post-more-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-tertiary);
      padding: 0.375rem;
      border-radius: var(--radius-full);
      transition: all var(--transition-fast);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .post-more-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .post-image-wrap {
      position: relative;
      width: 100%;
      background: var(--surface-hover);
    }

    .post-image {
      display: block;
      width: 100%;
      max-height: 600px;
      object-fit: contain;
      background: #000;
    }

    .post-actions {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 1rem 0.25rem;
    }

    .post-actions-left {
      display: flex;
      gap: 0.75rem;
    }

    .post-action-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-primary);
      font-size: 1.375rem;
      padding: 0.25rem;
      transition: all var(--transition-fast);
      border-radius: var(--radius-full);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .post-action-btn:hover {
      color: var(--primary-color);
      background: var(--surface-hover);
    }

    .post-likes {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 1rem 0.5rem;
    }

    .post-likes :host ::ng-deep .p-avatar-group .p-avatar {
      width: 1.25rem;
      height: 1.25rem;
      font-size: 0.5rem;
      border: 2px solid var(--surface-card);
      margin-left: -0.25rem;
    }

    .likes-text {
      font-size: 0.8125rem;
      color: var(--text-primary);
    }

    .post-caption {
      padding: 0 1rem 0.375rem;
      font-size: 0.8125rem;
      display: flex;
      gap: 0.375rem;
    }

    .caption-user {
      font-weight: 600;
      color: var(--text-primary);
      text-decoration: none;
      white-space: nowrap;
    }

    .caption-user:hover {
      text-decoration: underline;
    }

    .caption-text {
      color: var(--text-primary);
    }

    .post-comments {
      padding: 0 1rem 0.375rem;
      display: flex;
      justify-content: space-between;
    }

    .comments-link {
      color: var(--text-tertiary);
      font-size: 0.8125rem;
      cursor: pointer;
    }

    .comments-link:hover {
      color: var(--text-secondary);
    }

    .comment-time {
      color: var(--text-tertiary);
      font-size: 0.75rem;
    }

    .post-comment-input {
      border-top: 1px solid var(--surface-border);
      padding: 0.5rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .comment-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    .comment-input::placeholder {
      color: var(--text-tertiary);
    }

    .comment-post-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      font-weight: 600;
      cursor: pointer;
      font-size: 0.8125rem;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .comment-post-btn:hover {
      opacity: 1;
      background: var(--primary-color-light);
    }

    /* ===== RIGHT COLUMN ===== */
    .right-column {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Level Card */
    .level-card {
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1rem;
    }

    .level-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .level-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .level-label {
      font-size: 0.8125rem;
      opacity: 0.85;
    }

    .level-number {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .level-icon {
      font-size: 1.75rem;
      opacity: 0.85;
    }

    .level-bar-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .level-progress-bar {
      height: 6px !important;
      border-radius: var(--radius-full) !important;
    }

    .level-progress-bar :host ::ng-deep .p-progressbar {
      height: 6px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: var(--radius-full);
    }

    .level-progress-bar :host ::ng-deep .p-progressbar-value {
      background: white;
      border-radius: var(--radius-full);
    }

    .level-xp {
      font-size: 0.75rem;
      opacity: 0.85;
    }

    /* Achievements */
    .achievement-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .achievement-item:last-child { border-bottom: none; }

    .achievement-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      background: var(--surface-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      font-size: 1.25rem;
      flex-shrink: 0;
      border: 2px solid var(--surface-border);
    }

    .achievement-icon.unlocked {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-hover));
      color: white;
      border-color: transparent;
    }

    .achievement-info { flex: 1; min-width: 0; }

    .achievement-name {
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.125rem 0;
      font-size: 0.8125rem;
    }

    .achievement-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0 0 0.375rem 0;
    }

    .achievement-bar {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .achievement-progress-bar {
      height: 4px !important;
      border-radius: var(--radius-full) !important;
    }

    .achievement-progress-bar :host ::ng-deep .p-progressbar {
      height: 4px;
      background: var(--surface-hover);
      border-radius: var(--radius-full);
    }

    .achievement-progress-bar :host ::ng-deep .p-progressbar-value {
      background: linear-gradient(90deg, var(--primary-color), var(--primary-color-hover));
      border-radius: var(--radius-full);
    }

    .achievement-count {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
    }

    /* Suggestions */
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0;
      border-bottom: 1px solid var(--surface-border);
      text-decoration: none;
    }

    .suggestion-item:last-child { border-bottom: none; }

    .suggestion-info { flex: 1; min-width: 0; }

    .suggestion-name {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    .suggestion-followers {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.0625rem;
    }

    /* Trends */
    .trend-item {
      padding: 0.75rem;
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      margin-bottom: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .trend-item:last-child { margin-bottom: 0; }

    .trend-item:hover {
      background: var(--surface-hover);
      transform: translateX(2px);
    }

    .trend-category {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .trend-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .trend-posts {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1200px) {
      .home-container {
        grid-template-columns: 1fr 320px;
        max-width: 800px;
      }
      .left-column { display: none; }
    }

    @media (max-width: 900px) {
      .home-container {
        grid-template-columns: 1fr;
        max-width: 600px;
      }
      .right-column { display: none; }
    }

    @media (max-width: 640px) {
      .home-page { padding: 0.75rem 0; }
      .home-container { padding: 0 0.75rem; gap: 1rem; }
    }
  `]
})
export class HomePageComponent implements OnInit {
  private readonly homeService = inject(HomeService);
  private readonly cdr = inject(ChangeDetectorRef);

  stories: Story[] = [];
  posts: Post[] = [];
  suggestions: Suggestion[] = [];
  marketPromos: PromoItem[] = [];
  vetServices: VetService[] = [];
  newAdoptions: Adoption[] = [];
  upcomingAchievements: Achievement[] = [];
  userLevel: UserLevel = { level: 12, currentXp: 650, totalXp: 1000 };

  // Loading states
  loadingPosts = true;
  loadingStories = true;
  loadingSuggestions = true;
  loadingPromos = true;
  loadingServices = true;
  loadingAdoptions = true;
  loadingAchievements = true;

  ngOnInit(): void {
    this.loadAllData();
  }

  private loadAllData(): void {
    this.loadStories();
    this.loadPosts();
    this.loadSuggestions();
    this.loadMarketPromos();
    this.loadVetServices();
    this.loadNewAdoptions();
    this.loadAchievements();
    this.loadUserLevel();
  }

  private loadStories(): void {
    this.loadingStories = true;

    forkJoin({
      stories: this.homeService.getStories(),
      profiles: this.homeService.getAllProfiles()
    }).pipe(
      finalize(() => {
        this.loadingStories = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response.stories && response.stories.length > 0) {
          const profiles = response.profiles || [];

          // Create a map for faster lookup
          const profileMap = new Map(profiles.map(p => [p.authUserId, p]));

          this.stories = response.stories.map(story => {
            const profile = profileMap.get(story.userId);
            return new Story({
              id: story.id,
              user: new User({
                name: profile ? `${profile.firstName} ${profile.lastName}` : 'Usuario',
                avatar: profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                userId: story.userId
              }),
              seen: story.seen
            });
          });
          this.cdr.detectChanges();
        } else {
          this.stories = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading stories:', err);
        this.stories = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadPosts(): void {
    this.loadingPosts = true;

    forkJoin({
      posts: this.homeService.getAllPosts(),
      profiles: this.homeService.getAllProfiles()
    }).pipe(
      finalize(() => {
        this.loadingPosts = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response.posts && response.posts.length > 0) {
          const profiles = response.profiles || [];

          this.posts = response.posts.map(post => {
            const profile = profiles.find(p => p.authUserId === post.authorId);
            return new Post({
              id: post.id,
              user: new User({
                name: profile ? `${profile.firstName} ${profile.lastName}` : 'Usuario',
                avatar: profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                username: profile ? `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}` : '@usuario',
                userId: post.authorId
              }),
              timestamp: new Date(post.createdAt),
              image: post.imageUrl,
              likes: post.likesCount || 0,
              comments: post.commentsCount || 0,
              caption: post.caption || '',
              liked: false,
              saved: false
            });
          });
          this.cdr.detectChanges();
        } else {
          this.posts = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.posts = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadSuggestions(): void {
    this.loadingSuggestions = true;

    this.homeService.getSuggestions().pipe(
      finalize(() => {
        this.loadingSuggestions = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.suggestions = response.map(s => new Suggestion({
            username: s.username,
            avatar: s.avatar || 'https://i.pravatar.cc/150?img=1',
            followers: this.formatFollowers(s.followers || 0),
            userId: s.id
          }));
          this.cdr.detectChanges();
        } else {
          this.suggestions = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading suggestions:', err);
        this.suggestions = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadMarketPromos(): void {
    this.loadingPromos = true;

    this.homeService.getMarketPromos().pipe(
      finalize(() => {
        this.loadingPromos = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.marketPromos = response.map(promo => new PromoItem(promo));
          this.cdr.detectChanges();
        } else {
          this.marketPromos = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading market promos:', err);
        this.marketPromos = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadVetServices(): void {
    this.loadingServices = true;

    this.homeService.getVetServices().pipe(
      finalize(() => {
        this.loadingServices = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.vetServices = response.map(service => new VetService(service));
          this.cdr.detectChanges();
        } else {
          this.vetServices = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading vet services:', err);
        this.vetServices = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadNewAdoptions(): void {
    this.loadingAdoptions = true;

    this.homeService.getNewAdoptions().pipe(
      finalize(() => {
        this.loadingAdoptions = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.newAdoptions = response.map(adoption => new Adoption(adoption));
          this.cdr.detectChanges();
        } else {
          this.newAdoptions = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading new adoptions:', err);
        this.newAdoptions = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadAchievements(): void {
    this.loadingAchievements = true;

    this.homeService.getUpcomingAchievements().pipe(
      finalize(() => {
        this.loadingAchievements = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.upcomingAchievements = response.map(achievement => new Achievement(achievement));
          this.cdr.detectChanges();
        } else {
          this.upcomingAchievements = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading achievements:', err);
        this.upcomingAchievements = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadUserLevel(): void {
    this.homeService.getUserLevel().subscribe({
      next: (response) => {
        if (response) {
          this.userLevel = new UserLevel(response);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading user level:', err);
      }
    });
  }

  private formatFollowers(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }

  toggleLike(post: Post): void {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  }

  toggleSave(post: Post): void {
    post.saved = !post.saved;
  }
}
