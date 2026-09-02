import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  date?: string;
  category: 'social' | 'care' | 'exploration' | 'special';
  progress?: {
    current: number;
    target: number;
  };
}

interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  rank: string;
}

@Component({
  selector: 'app-gamification-page',
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    TagModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    SelectModule,
    CheckboxModule,
    ToastModule,
    AvatarModule,
    DividerModule,
    ChipModule,
  ],
  providers: [MessageService],
  template: `
    <div class="gamification-page-wrapper">
      <div class="gamification-page-container">

        <!-- ========================================================= -->
        <!-- HEADER -->
        <!-- ========================================================= -->

        <div class="gamification-page-header">
          <div class="gamification-page-header-content">
            <div class="gamification-page-header-left">
                            <h2 class="gamification-page-header-title">{{ 'gam.headerTitle' | transloco }}</h2>
              <p class="gamification-page-header-subtitle">{{ 'gam.headerSubtitle' | transloco }}</p>
            </div>
            <div class="gamification-page-header-stats">
              <div class="gamification-page-stat-item">
                                <span class="gamification-page-stat-value">{{ userStats().level }}</span>
                <span class="gamification-page-stat-label">{{ 'gam.statLevel' | transloco }}</span>
              </div>
              <div class="gamification-page-stat-divider"></div>
              <div class="gamification-page-stat-item">
                <span class="gamification-page-stat-value">{{ userStats().totalXP.toLocaleString() }}</span>
                <span class="gamification-page-stat-label">{{ 'gam.statXP' | transloco }}</span>
              </div>
              <div class="gamification-page-stat-divider"></div>
              <div class="gamification-page-stat-item">
                                <span class="gamification-page-stat-value">{{ userStats().achievementsUnlocked }}/{{ userStats().totalAchievements }}</span>
                <span class="gamification-page-stat-label">{{ 'gam.statAchievements' | transloco }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================= -->
        <!-- MAIN CONTENT -->
        <!-- ========================================================= -->

        <div class="gamification-page-main">

          <!-- ======================================================= -->
          <!-- SIDEBAR -->
          <!-- ======================================================= -->

          <aside class="gamification-page-sidebar">

            <!-- Perfil -->
            <div class="gamification-page-profile-card">
              <div class="gamification-page-profile-avatar-wrapper">
                <p-avatar
                  image="https://i.pravatar.cc/150?img=1"
                  shape="circle"
                  size="xlarge"
                  class="gamification-page-profile-avatar"
                />
                <div class="gamification-page-profile-level-badge">{{ userStats().level }}</div>
              </div>
              <div class="gamification-page-profile-info">
                <h3 class="gamification-page-profile-name">Tony Herrera</h3>
                <p class="gamification-page-profile-username">@tony_herrera</p>
                <p class="gamification-page-profile-rank">{{ userStats().rank }}</p>
              </div>
              <div class="gamification-page-profile-xp">
                <div class="gamification-page-profile-xp-header">
                  <span class="gamification-page-profile-xp-label">{{ 'gam.profileLevel' | transloco }} {{ userStats().level }}</span>
                  <span class="gamification-page-profile-xp-numbers">{{ userStats().currentXP.toLocaleString() }} / {{ userStats().nextLevelXP.toLocaleString() }} {{ 'gam.xpAbbr' | transloco }}</span>
                </div>
                <p-progressBar
                  [value]="levelProgress()"
                  [style]="{'height': '6px'}"
                  styleClass="gamification-page-xp-progress-bar"
                />
              </div>
            </div>

            <!-- Próximos Logros -->
            <div class="gamification-page-upcoming-card">
                            <h4 class="gamification-page-upcoming-title">{{ 'gam.upcomingTitle' | transloco }}</h4>
              <div class="gamification-page-upcoming-list">
                @for (achievement of upcomingAchievements(); track achievement.id) {
                  <div class="gamification-page-upcoming-item">
                    <div class="gamification-page-upcoming-icon">{{ achievement.icon }}</div>
                    <div class="gamification-page-upcoming-info">
                      <div class="gamification-page-upcoming-header">
                        <span class="gamification-page-upcoming-name">{{ achievement.name }}</span>
                                                <span class="gamification-page-upcoming-xp">+{{ achievement.xp }} {{ 'gam.xpAbbr' | transloco }}</span>
                      </div>
                      <span class="gamification-page-upcoming-desc">{{ achievement.description }}</span>
                      <div class="gamification-page-upcoming-progress">
                        <span class="gamification-page-upcoming-progress-text">
                          {{ achievement.progress?.current || 0 }} / {{ achievement.progress?.target || 0 }}
                        </span>
                        <p-progressBar
                          [value]="(achievement.progress?.current || 0) / (achievement.progress?.target || 1) * 100"
                          [style]="{'height': '4px'}"
                          styleClass="gamification-page-upcoming-progress-bar"
                        />
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Quién seguir -->
            <div class="gamification-page-follow-card">
                            <h4 class="gamification-page-follow-title">{{ 'gam.followTitle' | transloco }}</h4>
              <div class="gamification-page-follow-item">
                <p-avatar
                  image="https://i.pravatar.cc/150?img=2"
                  shape="circle"
                  size="normal"
                  class="gamification-page-follow-avatar"
                />
                <div class="gamification-page-follow-info">
                  <span class="gamification-page-follow-name">Antonio Herrera</span>
                  <span class="gamification-page-follow-username">@antonio_herrera</span>
                                  <span class="gamification-page-follow-count">625{{ 'gam.followers' | transloco }}</span>
                </div>
                                <button class="gamification-page-follow-btn">{{ 'gam.followButton' | transloco }}</button>
              </div>
            </div>

            <!-- Tendencias -->
            <div class="gamification-page-trending-card">
                            <h4 class="gamification-page-trending-title">{{ 'gam.trendingTitle' | transloco }}</h4>
              <div class="gamification-page-trending-item">
                <span class="gamification-page-trending-rank">#1 {{ 'gam.trending' | transloco }}</span>
                <span class="gamification-page-trending-name">@Prueba</span>
              </div>
            </div>

          </aside>

          <!-- ======================================================= -->
          <!-- MAIN - LISTA DE LOGROS -->
          <!-- ======================================================= -->

          <main class="gamification-page-achievements">

            <!-- Filtros -->
            <div class="gamification-page-filters-bar">
              <div class="gamification-page-filter-group">
                                <span class="gamification-page-filter-label">{{ 'gam.filterCategory' | transloco }}</span>
                @for (category of categories; track category.value) {
                  <button
                    class="gamification-page-filter-chip"
                    [class.gamification-page-filter-chip-active]="selectedCategories.includes(category.value)"
                    (click)="toggleCategory(category.value)"
                  >
                    {{ category.label }}
                  </button>
                }
              </div>
              <div class="gamification-page-filter-group">
                                <span class="gamification-page-filter-label">{{ 'gam.filterStatus' | transloco }}</span>
                <button
                  class="gamification-page-filter-chip"
                  [class.gamification-page-filter-chip-active]="filters.unlockedOnly"
                  (click)="toggleUnlockedOnly()"
                >
                                    {{ 'gam.unlocked' | transloco }}
                </button>
                <button
                  class="gamification-page-filter-chip"
                  [class.gamification-page-filter-chip-active]="filters.lockedOnly"
                  (click)="toggleLockedOnly()"
                >
                                    {{ 'gam.locked' | transloco }}
                </button>
                <button
                  class="gamification-page-filter-chip gamification-page-filter-chip-clear"
                  (click)="clearFilters()"
                >
                                    <i class="pi pi-times"></i> {{ 'gam.clearFilters' | transloco }}
                </button>
              </div>
            </div>

            <!-- Resultados -->
            <div class="gamification-page-results-header">
              <span class="gamification-page-results-count">
                {{ filteredAchievements().length }} {{ (filteredAchievements().length !== 1 ? 'gam.resultPlural' : 'gam.resultSingular') | transloco }}
              </span>
            </div>

            <!-- Achievements Grid -->
            <div class="gamification-page-achievements-grid">
              @for (achievement of filteredAchievements(); track achievement.id) {
                <div class="gamification-page-achievement-card" [class.gamification-page-achievement-card-unlocked]="achievement.unlocked">
                  <div class="gamification-page-achievement-icon" [class.gamification-page-achievement-icon-unlocked]="achievement.unlocked">
                    <span class="gamification-page-achievement-emoji">{{ achievement.icon }}</span>
                    @if (achievement.unlocked) {
                      <div class="gamification-page-achievement-badge">
                        <i class="pi pi-check"></i>
                      </div>
                    }
                  </div>
                  <div class="gamification-page-achievement-content">
                    <div class="gamification-page-achievement-title-row">
                      <h3 class="gamification-page-achievement-name">{{ ('gam.ach.' + achievement.key + '.name') | transloco }}</h3>
                      <span class="gamification-page-achievement-xp">+{{ achievement.xp }} {{ 'gam.xpAbbr' | transloco }}</span>
                    </div>
                    <p class="gamification-page-achievement-desc">{{ ('gam.ach.' + achievement.key + '.description') | transloco }}</p>
                    <div class="gamification-page-achievement-footer">
                      <p-tag
                        [value]="achievement.unlocked ? ('gam.unlocked' | transloco) : ('gam.locked' | transloco)"
                        [severity]="achievement.unlocked ? 'success' : 'secondary'"
                      />
                      @if (achievement.unlocked && achievement.date) {
                        <span class="gamification-page-achievement-date">
                          <i class="pi pi-calendar"></i>
                          {{ achievement.date }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (filteredAchievements().length === 0) {
              <div class="gamification-page-empty-state">
                <i class="pi pi-trophy"></i>
                                    <p>{{ 'gam.emptyState' | transloco }}</p>
                <button class="gamification-page-empty-btn" (click)="clearFilters()">
                                    {{ 'gam.clearFiltersBtn' | transloco }}
                </button>
              </div>
            }

          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==============================================================
       PAGE CONTAINER
       ============================================================== */

    .gamification-page-wrapper {
      min-height: 100vh;
      padding: 1rem 0;
      background: #f0f2f5;
    }

    .gamification-page-container {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* ==============================================================
       HEADER
       ============================================================== */

    .gamification-page-header {
      margin-bottom: 1.5rem;
    }

    .gamification-page-header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .gamification-page-header-left {
      flex: 1;
      min-width: 0;
    }

    .gamification-page-header-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .gamification-page-header-subtitle {
      margin: 0.125rem 0 0;
      color: #6b7280;
      font-size: 0.8125rem;
    }

    .gamification-page-header-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.5rem 1rem;
      background: #ffffff;
      border-radius: 8px;
    }

    .gamification-page-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 50px;
    }

    .gamification-page-stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .gamification-page-stat-label {
      font-size: 0.625rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .gamification-page-stat-divider {
      width: 1px;
      height: 2rem;
      background: #e5e7eb;
    }

    /* ==============================================================
       MAIN LAYOUT
       ============================================================== */

    .gamification-page-main {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    /* ==============================================================
       SIDEBAR
       ============================================================== */

    .gamification-page-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* --- Profile Card --- */
    .gamification-page-profile-card {
      background: #ffffff;
      border-radius: 8px;
      padding: 1.25rem;
      text-align: center;
    }

    .gamification-page-profile-avatar-wrapper {
      position: relative;
      display: inline-block;
    }

    .gamification-page-profile-level-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 28px;
      height: 28px;
      background: #4f46e5;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      border: 2px solid #ffffff;
    }

    .gamification-page-profile-info {
      margin-top: 0.75rem;
    }

    .gamification-page-profile-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .gamification-page-profile-username {
      margin: 0.125rem 0;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .gamification-page-profile-rank {
      margin: 0.125rem 0 0.75rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .gamification-page-profile-xp {
      text-align: left;
    }

    .gamification-page-profile-xp-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .gamification-page-profile-xp-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: #6b7280;
    }

    .gamification-page-profile-xp-numbers {
      font-size: 0.6875rem;
      color: #9ca3af;
    }

    :host ::ng-deep .gamification-page-xp-progress-bar {
      height: 6px !important;
      border-radius: 9999px !important;
      background: #f3f4f6 !important;
    }

    :host ::ng-deep .gamification-page-xp-progress-bar .p-progressbar-value {
      background: #4f46e5 !important;
      border-radius: 9999px !important;
    }

    /* --- Upcoming Achievements --- */
    .gamification-page-upcoming-card {
      background: #ffffff;
      border-radius: 8px;
      padding: 1rem 1.25rem;
    }

    .gamification-page-upcoming-title {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .gamification-page-upcoming-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .gamification-page-upcoming-item {
      display: flex;
      gap: 0.625rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .gamification-page-upcoming-item:last-child {
      border-bottom: none;
    }

    .gamification-page-upcoming-icon {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      background: #f3f4f6;
      border-radius: 4px;
    }

    .gamification-page-upcoming-info {
      flex: 1;
      min-width: 0;
    }

    .gamification-page-upcoming-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .gamification-page-upcoming-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1a1a2e;
    }

    .gamification-page-upcoming-xp {
      font-size: 0.625rem;
      color: #4f46e5;
      font-weight: 500;
    }

    .gamification-page-upcoming-desc {
      font-size: 0.6875rem;
      color: #6b7280;
      display: block;
      margin: 0.125rem 0 0.25rem;
    }

    .gamification-page-upcoming-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .gamification-page-upcoming-progress-text {
      font-size: 0.625rem;
      color: #9ca3af;
      white-space: nowrap;
    }

    :host ::ng-deep .gamification-page-upcoming-progress-bar {
      height: 4px !important;
      border-radius: 9999px !important;
      background: #f3f4f6 !important;
      flex: 1;
    }

    :host ::ng-deep .gamification-page-upcoming-progress-bar .p-progressbar-value {
      background: #4f46e5 !important;
      border-radius: 9999px !important;
    }

    /* --- Who to follow --- */
    .gamification-page-follow-card {
      background: #ffffff;
      border-radius: 8px;
      padding: 1rem 1.25rem;
    }

    .gamification-page-follow-title {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .gamification-page-follow-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .gamification-page-follow-info {
      flex: 1;
      min-width: 0;
    }

    .gamification-page-follow-name {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1a1a2e;
    }

    .gamification-page-follow-username {
      font-size: 0.6875rem;
      color: #6b7280;
    }

    .gamification-page-follow-count {
      font-size: 0.625rem;
      color: #9ca3af;
    }

    .gamification-page-follow-btn {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #e5e7eb;
      background: transparent;
      color: #6b7280;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .gamification-page-follow-btn:hover {
      background: #f3f4f6;
      color: #1a1a2e;
    }

    /* --- Trending --- */
    .gamification-page-trending-card {
      background: #ffffff;
      border-radius: 8px;
      padding: 1rem 1.25rem;
    }

    .gamification-page-trending-title {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .gamification-page-trending-item {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .gamification-page-trending-rank {
      font-size: 0.625rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .gamification-page-trending-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1a1a2e;
    }

    /* ==============================================================
       ACHIEVEMENTS MAIN
       ============================================================== */

    .gamification-page-achievements {
      min-width: 0;
    }

    /* --- Filters Bar --- */
    .gamification-page-filters-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1rem;
      margin-bottom: 1rem;
      padding: 0.5rem 0;
    }

    .gamification-page-filter-group {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .gamification-page-filter-label {
      font-size: 0.75rem;
      color: #9ca3af;
      font-weight: 500;
      margin-right: 0.25rem;
    }

    .gamification-page-filter-chip {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #e5e7eb;
      background: transparent;
      color: #6b7280;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .gamification-page-filter-chip:hover {
      background: #f3f4f6;
      color: #1a1a2e;
    }

    .gamification-page-filter-chip-active {
      background: #4f46e5;
      color: white;
      border-color: #4f46e5;
    }

    .gamification-page-filter-chip-active:hover {
      background: #4338ca;
      color: white;
    }

    .gamification-page-filter-chip-clear {
      color: #9ca3af;
    }

    .gamification-page-filter-chip-clear:hover {
      color: #1a1a2e;
      background: #f3f4f6;
    }

    .gamification-page-filter-chip-clear i {
      font-size: 0.625rem;
    }

    /* --- Results --- */
    .gamification-page-results-header {
      margin-bottom: 0.75rem;
    }

    .gamification-page-results-count {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    /* --- Achievements Grid --- */
    .gamification-page-achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    /* --- Achievement Card --- */
    .gamification-page-achievement-card {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #ffffff;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .gamification-page-achievement-card:hover {
      background: #f9fafb;
      transform: translateY(-1px);
    }

    .gamification-page-achievement-card-unlocked {
      background: #ffffff;
    }

    .gamification-page-achievement-icon {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: #f3f4f6;
    }

    .gamification-page-achievement-icon-unlocked {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    }

    .gamification-page-achievement-emoji {
      font-size: 1.25rem;
      line-height: 1;
    }

    .gamification-page-achievement-badge {
      position: absolute;
      right: -4px;
      bottom: -4px;
      width: 18px;
      height: 18px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.5rem;
      border: 2px solid #ffffff;
    }

    .gamification-page-achievement-content {
      flex: 1;
      min-width: 0;
    }

    .gamification-page-achievement-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.125rem;
    }

    .gamification-page-achievement-name {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1a1a2e;
    }

    .gamification-page-achievement-xp {
      flex-shrink: 0;
      font-size: 0.625rem;
      font-weight: 600;
      color: #4f46e5;
    }

    .gamification-page-achievement-desc {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .gamification-page-achievement-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .gamification-page-achievement-date {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.625rem;
      color: #9ca3af;
    }

    .gamification-page-achievement-date i {
      font-size: 0.625rem;
    }

    :host ::ng-deep .gamification-page-achievement-footer .p-tag {
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.625rem;
      font-weight: 500;
    }

    /* --- Empty State --- */
    .gamification-page-empty-state {
      text-align: center;
      padding: 3rem 2rem;
      background: #ffffff;
      border-radius: 8px;
    }

    .gamification-page-empty-state i {
      font-size: 2.5rem;
      color: #9ca3af;
      margin-bottom: 0.75rem;
    }

    .gamification-page-empty-state p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1rem;
    }

    .gamification-page-empty-btn {
      padding: 0.375rem 1rem;
      border-radius: 9999px;
      border: 1px solid #e5e7eb;
      background: transparent;
      color: #6b7280;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .gamification-page-empty-btn:hover {
      background: #f3f4f6;
      color: #1a1a2e;
    }

    /* ==============================================================
       RESPONSIVE
       ============================================================== */

    @media (max-width: 1024px) {
      .gamification-page-main {
        grid-template-columns: 1fr;
      }

      .gamification-page-sidebar {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
    }

    @media (max-width: 768px) {
      .gamification-page-header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .gamification-page-header-stats {
        justify-content: center;
      }

      .gamification-page-sidebar {
        grid-template-columns: 1fr;
      }

      .gamification-page-filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .gamification-page-filter-group {
        flex-wrap: wrap;
      }

      .gamification-page-achievements-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .gamification-page-container {
        padding: 0 0.75rem;
      }

      .gamification-page-header-stats {
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
      }

      .gamification-page-stat-divider {
        height: 1.5rem;
      }

      .gamification-page-achievement-card {
        padding: 0.75rem;
      }
    }
  `]
})
export class GamificationPageComponent {
  readonly i18n = inject(TranslocoService);
  private messageService = inject(MessageService);

  // ============================================================
  // FILTERS
  // ============================================================

  categories = [
    { label: this.i18n.translate('gam.cat.social'), value: 'social' },
    { label: this.i18n.translate('gam.cat.care'), value: 'care' },
    { label: this.i18n.translate('gam.cat.exploration'), value: 'exploration' },
    { label: this.i18n.translate('gam.cat.special'), value: 'special' }
  ];

  selectedCategories: string[] = [];
  filters = {
    unlockedOnly: false,
    lockedOnly: false
  };

  // ============================================================
  // USER STATS
  // ============================================================

  userStats = signal<UserStats>({
    level: 12,
    currentXP: 650,
    nextLevelXP: 1000,
    totalXP: 2450,
    achievementsUnlocked: 12,
    totalAchievements: 100,
    rank: this.i18n.translate('gam.rankExpert')
  });

  // ============================================================
  // COMPUTED
  // ============================================================

  levelProgress = computed(() => {
    const stats = this.userStats();
    return Math.min(100, (stats.currentXP / stats.nextLevelXP) * 100);
  });

  xpToNextLevel = computed(() => {
    const stats = this.userStats();
    return Math.max(0, stats.nextLevelXP - stats.currentXP);
  });

  upcomingAchievements = computed(() => {
    return this.achievements()
      .filter(a => !a.unlocked)
      .slice(0, 4)
      .map(a => ({
        ...a,
        progress: a.progress || { current: 0, target: 10 }
      }));
  });

  filteredAchievements = computed(() => {
    let result = [...this.achievements()];

    if (this.selectedCategories.length > 0) {
      result = result.filter(a => this.selectedCategories.includes(a.category));
    }

    if (this.filters.unlockedOnly) {
      result = result.filter(a => a.unlocked);
    }
    if (this.filters.lockedOnly) {
      result = result.filter(a => !a.unlocked);
    }

    return result;
  });

  // ============================================================
  // ACHIEVEMENTS
  // ============================================================

  achievements = signal<Achievement[]>([
    {
      id: '1',
      key: '1',
            name: this.i18n.translate('gam.ach.1.name'),
      description: this.i18n.translate('gam.ach.1.description'),
      icon: '🎖️',
      xp: 50,
      unlocked: true,
      date: '15/03/2024',
      category: 'exploration'
    },
    {
      id: '2',
      key: '2',
            name: this.i18n.translate('gam.ach.2.name'),
      description: this.i18n.translate('gam.ach.2.description'),
      icon: '🐾',
      xp: 100,
      unlocked: true,
      date: '20/04/2024',
      category: 'care'
    },
    {
      id: '3',
      key: '3',
            name: this.i18n.translate('gam.ach.3.name'),
      description: this.i18n.translate('gam.ach.3.description'),
      icon: '💉',
      xp: 150,
      unlocked: false,
      category: 'care',
      progress: { current: 3, target: 10 }
    },
    {
      id: '4',
      key: '4',
            name: this.i18n.translate('gam.ach.4.name'),
      description: this.i18n.translate('gam.ach.4.description'),
      icon: '📱',
      xp: 200,
      unlocked: false,
      category: 'social',
      progress: { current: 12, target: 50 }
    },
    {
      id: '5',
      key: '5',
            name: this.i18n.translate('gam.ach.5.name'),
      description: this.i18n.translate('gam.ach.5.description'),
      icon: '🗺️',
      xp: 100,
      unlocked: true,
      date: '10/05/2024',
      category: 'exploration'
    },
    {
      id: '6',
      key: '6',
            name: this.i18n.translate('gam.ach.6.name'),
      description: this.i18n.translate('gam.ach.6.description'),
      icon: '🏆',
      xp: 300,
      unlocked: false,
      category: 'special',
      progress: { current: 0, target: 1 }
    },
    {
      id: '7',
      key: '7',
            name: this.i18n.translate('gam.ach.7.name'),
      description: this.i18n.translate('gam.ach.7.description'),
      icon: '🤝',
      xp: 250,
      unlocked: true,
      date: '05/06/2024',
      category: 'social'
    },
    {
      id: '8',
      key: '8',
            name: this.i18n.translate('gam.ach.8.name'),
      description: this.i18n.translate('gam.ach.8.description'),
      icon: '💚',
      xp: 500,
      unlocked: false,
      category: 'special',
      progress: { current: 0, target: 1 }
    },
    {
      id: '9',
      key: '9',
            name: this.i18n.translate('gam.ach.9.name'),
      description: this.i18n.translate('gam.ach.9.description'),
      icon: '🗣️',
      xp: 50,
      unlocked: false,
      category: 'social',
      progress: { current: 1, target: 1 }
    },
    {
      id: '10',
      key: '10',
            name: this.i18n.translate('gam.ach.10.name'),
      description: this.i18n.translate('gam.ach.10.description'),
      icon: '✍️',
      xp: 100,
      unlocked: false,
      category: 'social',
      progress: { current: 1, target: 10 }
    },
    {
      id: '11',
      key: '11',
            name: this.i18n.translate('gam.ach.11.name'),
      description: this.i18n.translate('gam.ach.11.description'),
      icon: '💚',
      xp: 150,
      unlocked: false,
      category: 'social',
      progress: { current: 0, target: 10 }
    }
  ]);

  // ============================================================
  // METHODS
  // ============================================================

  toggleCategory(categoryValue: string) {
    const index = this.selectedCategories.indexOf(categoryValue);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryValue);
    }
  }

  toggleUnlockedOnly() {
    this.filters.unlockedOnly = !this.filters.unlockedOnly;
    if (this.filters.unlockedOnly) {
      this.filters.lockedOnly = false;
    }
  }

  toggleLockedOnly() {
    this.filters.lockedOnly = !this.filters.lockedOnly;
    if (this.filters.lockedOnly) {
      this.filters.unlockedOnly = false;
    }
  }

  clearFilters() {
    this.selectedCategories = [];
    this.filters = {
      unlockedOnly: false,
      lockedOnly: false
    };
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('gam.toastCleared'),
      detail: this.i18n.translate('gam.toastClearedDetail')
    });
  }
}
