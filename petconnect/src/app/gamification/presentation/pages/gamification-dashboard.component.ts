import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';
import { GamificationService } from '../../infrastructure/services/gamification.service';
import {
  Achievement,
  AchievementCategory,
  GamificationSummary,
  Goal,
} from '../../domain/gamification.models';

@Component({
  selector: 'app-gamification-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    TagModule,
    ToastModule,
    CheckboxModule,
    SkeletonModule,
    AvatarModule,
    DividerModule,
    ChipModule,
    TranslocoModule,
  ],
  providers: [MessageService],
  template: `
    <div class="gamification-dashboard">
      <p-toast />

      <!-- ========================================================= -->
      <!-- HEADER -->
      <!-- ========================================================= -->

      <div class="dashboard-header">
        <div class="dashboard-header-left">
          <h2>{{ 'gamd.title' | transloco }}</h2>
          <p>{{ 'gamd.subtitle' | transloco }}</p>
        </div>
        <div class="dashboard-header-stats">
          <div class="header-stat-item">
            <span class="header-stat-value">{{ summary()?.level ?? 0 }}</span>
            <span class="header-stat-label">{{ 'gamd.level' | transloco }}</span>
          </div>
          <div class="header-stat-divider"></div>
          <div class="header-stat-item">
            <span class="header-stat-value">{{ (summary()?.totalXp ?? 0).toLocaleString() }}</span>
            <span class="header-stat-label">{{ 'gamd.totalXp' | transloco }}</span>
          </div>
          <div class="header-stat-divider"></div>
          <div class="header-stat-item">
            <span class="header-stat-value">{{ summary()?.streakDays ?? 0 }}</span>
            <span class="header-stat-label">{{ 'gamd.streak' | transloco }}</span>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- LEVEL CARD -->
      <!-- ========================================================= -->

      <div class="dashboard-level-card">
        @if (summary()) {
          <div class="level-summary">
            <div class="level-avatar-wrapper">
              <div class="level-avatar">
                <span class="level-number">{{ summary()?.level ?? 0 }}</span>
              </div>
              <span class="level-label">{{ 'gamd.levelAbbr' | transloco }}</span>
            </div>
            <div class="level-info">
              <div class="level-info-header">
                <h3>{{ rankTitleValue() }}</h3>
                <span class="level-xp-text">
                  {{ summary()?.currentLevelXp ?? 0 }} / {{ summary()?.xpToLevel ?? 0 }} {{ 'gamd.xp' | transloco }}
                </span>
              </div>
              <p-progressBar [value]="levelProgress()" [showValue]="false" styleClass="level-progress-bar" />
              <div class="level-meta">
                <span class="level-meta-item">
                  <i class="pi pi-bolt"></i>
                  {{ (summary()?.totalXp ?? 0).toLocaleString() }} {{ 'gamd.xpTotal' | transloco }}
                </span>
                <span class="level-meta-item">
                  <i class="pi pi-calendar"></i>
                  {{ 'gamd.streakDays' | transloco: { days: summary()?.streakDays ?? 0 } }}
                </span>
                <span class="level-meta-item">
                  <i class="pi pi-sun"></i>
                  {{ 'gamd.xpToday' | transloco: { earned: summary()?.dailyXpEarned ?? 0, limit: summary()?.dailyXpLimit ?? 100 } }}
                </span>
              </div>
            </div>
          </div>
        } @else {
          <div class="skeleton-container">
            <p-skeleton width="100%" height="6rem" />
          </div>
        }
      </div>

      <!-- ========================================================= -->
      <!-- DASHBOARD GRID -->
      <!-- ========================================================= -->

      <div class="dashboard-grid">

        <!-- ======================================================= -->
        <!-- GOALS SECTION -->
        <!-- ======================================================= -->

        <section class="goals-section">

          <div class="section-header">
            <h3>{{ 'gamd.goalsTitle' | transloco }}</h3>
            <p>{{ 'gamd.goalsSubtitle' | transloco }}</p>
          </div>

          <!-- Daily Goals -->
          <div class="goals-card">
            <div class="goals-card-header">
              <span class="goals-card-title">{{ 'gamd.today' | transloco }}</span>
              <span class="goals-card-badge">{{ 'gamd.daily' | transloco }}</span>
            </div>
            <div class="goals-list">
              @for (goal of dailyGoals(); track goal.code) {
                <div class="goal-item" [class.completed]="goal.canClaim" [class.claimed]="goal.claimed">
                  <div class="goal-icon-wrapper">
                    <i class="pi" [class]="goal.icon"></i>
                  </div>
                  <div class="goal-content">
                    <div class="goal-name-row">
                      <span class="goal-name">{{ goal.name }}</span>
                      @if (goal.claimed) {
                        <p-tag [value]="'gamd.claimed' | transloco" severity="success" styleClass="goal-tag" />
                      } @else if (goal.canClaim) {
                        <p-tag [value]="'gamd.completed' | transloco" severity="warn" styleClass="goal-tag" />
                      }
                    </div>
                    <div class="goal-progress-row">
                      <p-progressBar [value]="goalProgress(goal)" [showValue]="false" styleClass="goal-progress-bar" />
                      <span class="goal-progress-text">{{ goal.progress }}/{{ goal.targetValue }}</span>
                    </div>
                  </div>
                  <div class="goal-actions">
                    <span class="goal-xp">+{{ goal.xpReward }} XP</span>
                    <button
                      class="goal-claim-btn"
                      [disabled]="!goal.canClaim || goal.claimed"
                      (click)="claimGoal(goal.code)"
                    >
                      <i class="pi pi-check"></i>
                      {{ 'gamd.claim' | transloco }}
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="goals-empty">{{ 'gamd.noDaily' | transloco }}</p>
              }
            </div>
          </div>

          <!-- Weekly Goals -->
          <div class="goals-card">
            <div class="goals-card-header">
              <span class="goals-card-title">{{ 'gamd.thisWeek' | transloco }}</span>
              <span class="goals-card-badge">{{ 'gamd.weekly' | transloco }}</span>
            </div>
            <div class="goals-list">
              @for (goal of weeklyGoals(); track goal.code) {
                <div class="goal-item" [class.completed]="goal.canClaim" [class.claimed]="goal.claimed">
                  <div class="goal-icon-wrapper">
                    <i class="pi" [class]="goal.icon"></i>
                  </div>
                  <div class="goal-content">
                    <div class="goal-name-row">
                      <span class="goal-name">{{ goal.name }}</span>
                      @if (goal.claimed) {
                        <p-tag [value]="'gamd.claimed' | transloco" severity="success" styleClass="goal-tag" />
                      } @else if (goal.canClaim) {
                        <p-tag [value]="'gamd.completed' | transloco" severity="warn" styleClass="goal-tag" />
                      }
                    </div>
                    <div class="goal-progress-row">
                      <p-progressBar [value]="goalProgress(goal)" [showValue]="false" styleClass="goal-progress-bar" />
                      <span class="goal-progress-text">{{ goal.progress }}/{{ goal.targetValue }}</span>
                    </div>
                  </div>
                  <div class="goal-actions">
                    <span class="goal-xp">+{{ goal.xpReward }} XP</span>
                    <button
                      class="goal-claim-btn"
                      [disabled]="!goal.canClaim || goal.claimed"
                      (click)="claimGoal(goal.code)"
                    >
                      <i class="pi pi-check"></i>
                      {{ 'gamd.claim' | transloco }}
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="goals-empty">{{ 'gamd.noWeekly' | transloco }}</p>
              }
            </div>
          </div>

        </section>

        <!-- ======================================================= -->
        <!-- ACHIEVEMENTS SECTION -->
        <!-- ======================================================= -->

        <section class="achievements-section">

          <div class="section-header">
            <h3>{{ 'gamd.achTitle' | transloco }}</h3>
            <p>{{ 'gamd.achSubtitle' | transloco }}</p>
          </div>

          <!-- Filters -->
          <details class="filters-bar" open>
            <summary class="filters-summary">
              <span class="filters-summary-title">
                <i class="pi pi-sliders-h" aria-hidden="true"></i>
                {{ 'feedGrid.filters' | transloco }}
              </span>
              <span class="filters-summary-meta">
                <span class="results-count">
                  {{ filteredAchievements().length }} {{ (filteredAchievements().length !== 1 ? 'gam.resultPlural' : 'gam.resultSingular') | transloco }}
                </span>
                <i class="pi pi-chevron-down accordion-chevron" aria-hidden="true"></i>
              </span>
            </summary>
            <div class="filter-panel">
            <div class="filters-group">
              <span class="filter-label">{{ 'gamd.category' | transloco }}</span>
              @for (cat of categories; track cat) {
                <button
                  class="filter-chip"
                  [class.active]="selectedCategories().includes(cat)"
                  (click)="toggleCategory(cat)"
                >
                  {{ 'gamd.cat.' + cat | transloco }}
                </button>
              }
              <button class="filter-chip filter-chip-clear" (click)="clearFilters()">
                <i class="pi pi-times"></i> {{ 'gamd.clear' | transloco }}
              </button>
            </div>
            </div>
          </details>

          <!-- Achievements Grid -->
          <div class="achievements-grid">
            @for (a of filteredAchievements(); track a.code) {
              <div class="achievement-item" [class.unlocked]="a.state !== 'LOCKED'">
                <div class="achievement-icon-wrapper" [class.unlocked]="a.state !== 'LOCKED'">
                  <i class="pi" [class]="a.icon"></i>
                </div>
                <div class="achievement-info">
                  <div class="achievement-top">
                    <h4>{{ a.name }}</h4>
                    <p-tag
                      [value]="a.state === 'LOCKED' ? ('gamd.locked' | transloco) : a.state === 'UNLOCKED' ? ('gamd.unlocked' | transloco) : ('gamd.completed' | transloco)"
                      [severity]="a.state === 'LOCKED' ? 'secondary' : 'success'"
                      styleClass="achievement-status-tag"
                    />
                  </div>
                  <p class="achievement-desc">{{ a.description }}</p>
                  <div class="achievement-progress-row">
                    <p-progressBar [value]="achievementProgress(a)" [showValue]="false" styleClass="achievement-progress-bar" />
                    <span class="achievement-progress-text">{{ a.progress }}/{{ a.targetValue }}</span>
                  </div>
                  <div class="achievement-footer">
                    <span class="achievement-category">{{ 'gamd.cat.' + a.category | transloco }}</span>
                    <span class="achievement-xp">+{{ a.xpReward }} XP</span>
                  </div>
                </div>
              </div>
            } @empty {
              <p class="achievements-empty">{{ 'gamd.noAchievements' | transloco }}</p>
            }
          </div>

        </section>

      </div>
    </div>
  `,
  styles: [`
    /* ==============================================================
       PAGE - Usando variables CSS como social-page
       ============================================================== */

    .gamification-dashboard {
      min-height: 100vh;
      padding: 1rem;
      max-width: var(--max-page-width);
      margin: 0 auto;
      background: var(--surface-ground);
    }

    /* ==============================================================
       HEADER
       ============================================================== */

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .dashboard-header-left {
      flex: 1;
      min-width: 0;
    }

    .dashboard-header-left h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .dashboard-header-left p {
      margin: 0.125rem 0 0;
      color: var(--text-secondary);
      font-size: 0.8125rem;
    }

    .dashboard-header-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .header-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 50px;
    }

    .header-stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .header-stat-label {
      font-size: 0.625rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .header-stat-divider {
      width: 1px;
      height: 2rem;
      background: var(--surface-border);
    }

    /* ==============================================================
       LEVEL CARD
       ============================================================== */

    .dashboard-level-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .level-summary {
      display: flex;
      gap: 1.25rem;
      align-items: center;
    }

    .level-avatar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .level-avatar {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-full);
      background: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .level-avatar .level-number {
      font-size: 1.75rem;
      line-height: 1;
    }

    .level-label {
      font-size: 0.625rem;
      font-weight: 600;
      color: var(--text-tertiary);
      letter-spacing: 0.05em;
    }

    .level-info {
      flex: 1;
      min-width: 0;
    }

    .level-info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .level-info-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .level-xp-text {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    :host ::ng-deep .level-progress-bar {
      height: 6px !important;
      border-radius: var(--radius-full) !important;
      background: var(--surface-hover) !important;
    }

    :host ::ng-deep .level-progress-bar .p-progressbar-value {
      background: var(--primary-color) !important;
      border-radius: var(--radius-full) !important;
    }

    .level-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .level-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .level-meta-item i {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .skeleton-container {
      display: block;
    }

    /* ==============================================================
       DASHBOARD GRID
       ============================================================== */

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    /* ==============================================================
       SECTION HEADER
       ============================================================== */

    .section-header {
      margin-bottom: 1rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .section-header p {
      margin: 0.125rem 0 0;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    /* ==============================================================
       GOALS SECTION
       ============================================================== */

    .goals-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .goals-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .goals-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .goals-card-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .goals-card-badge {
      font-size: 0.625rem;
      font-weight: 500;
      color: var(--text-tertiary);
      background: var(--surface-hover);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .goals-list {
      padding: 0.5rem 0;
    }

    .goal-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      transition: background 0.2s ease;
    }

    .goal-item:hover {
      background: var(--surface-hover);
    }

    .goal-item.completed {
      background: var(--surface-card);
    }

    .goal-item.claimed {
      opacity: 0.6;
    }

    .goal-icon-wrapper {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      background: var(--surface-hover);
      color: var(--primary-color);
    }

    .goal-icon-wrapper i {
      font-size: 1rem;
    }

    .goal-content {
      flex: 1;
      min-width: 0;
    }

    .goal-name-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .goal-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    :host ::ng-deep .goal-tag {
      padding: 0.0625rem 0.375rem !important;
      font-size: 0.5625rem !important;
      border-radius: var(--radius-full) !important;
      font-weight: 500 !important;
    }

    .goal-progress-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.125rem;
    }

    :host ::ng-deep .goal-progress-bar {
      height: 4px !important;
      border-radius: var(--radius-full) !important;
      background: var(--surface-hover) !important;
      flex: 1;
    }

    :host ::ng-deep .goal-progress-bar .p-progressbar-value {
      background: var(--primary-color) !important;
      border-radius: var(--radius-full) !important;
    }

    .goal-progress-text {
      font-size: 0.625rem;
      color: var(--text-tertiary);
      white-space: nowrap;
    }

    .goal-actions {
      flex-shrink: 0;
      text-align: right;
    }

    .goal-xp {
      display: block;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }

    .goal-claim-btn {
      padding: 0.1875rem 0.625rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--surface-border);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.625rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      white-space: nowrap;
    }

    .goal-claim-btn:hover:not(:disabled) {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: #ffffff;
    }

    .goal-claim-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .goal-claim-btn i {
      font-size: 0.5625rem;
    }

    .goals-empty {
      padding: 1rem;
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      text-align: center;
      margin: 0;
    }

    /* ==============================================================
       ACHIEVEMENTS SECTION
       ============================================================== */

    .achievements-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Filters — mismo patrón plegable que el toolbar de adopciones */
    .filters-bar {
      margin: 0 auto 1.25rem;
      padding: 1rem 1.25rem;
      background: var(--surface-card);
      border: none;
      border-radius: var(--radius-lg);
    }
    .filters-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: var(--text-primary); cursor: pointer; list-style: none; }
    .filters-summary::-webkit-details-marker { display: none; }
    .filters-summary-title, .filters-summary-meta { display: inline-flex; align-items: center; gap: .75rem; }
    .filters-summary-title { font-weight: 650; }
    .filters-summary-title > i { color: var(--primary-color); }
    .accordion-chevron { color: var(--text-secondary); transition: transform var(--transition-fast); }
    .filters-bar[open] .accordion-chevron { transform: rotate(180deg); }
    .filter-panel { display: grid; gap: .75rem; padding-top: 1rem; }
    .results-count { color: var(--text-secondary); font-size: .85rem; white-space: nowrap; }

    .filters-group {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 650;
      margin-right: 0.25rem;
    }

    .filter-chip {
      min-height: 2.75rem;
      padding: 0.65rem 0.8rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-border);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .filter-chip:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .filter-chip.active {
      background: var(--primary-color);
      color: #ffffff;
      border-color: var(--primary-color);
    }

    .filter-chip.active:hover {
      background: var(--primary-color-hover);
    }

    .filter-chip-clear {
      color: var(--text-tertiary);
    }

    .filter-chip-clear:hover {
      color: var(--text-primary);
      background: var(--surface-hover);
    }

    .filter-chip-clear i {
      font-size: 0.5625rem;
    }

    /* Achievements Grid */
    .achievements-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.625rem;
    }

    .achievement-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--surface-card);
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
    }

    .achievement-item:hover {
      background: var(--surface-hover);
    }

    .achievement-item.unlocked {
      background: var(--surface-card);
    }

    .achievement-item.unlocked:hover {
      background: var(--surface-hover);
    }

    .achievement-icon-wrapper {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      background: var(--surface-hover);
      color: var(--text-secondary);
    }

    .achievement-icon-wrapper i {
      font-size: 1.125rem;
    }

    .achievement-icon-wrapper.unlocked {
      background: var(--primary-color);
      color: #ffffff;
    }

    .achievement-info {
      flex: 1;
      min-width: 0;
    }

    .achievement-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .achievement-top h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    :host ::ng-deep .achievement-status-tag {
      padding: 0.0625rem 0.375rem !important;
      font-size: 0.5625rem !important;
      border-radius: var(--radius-full) !important;
      font-weight: 500 !important;
    }

    .achievement-desc {
      margin: 0.125rem 0 0.375rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .achievement-progress-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    :host ::ng-deep .achievement-progress-bar {
      height: 4px !important;
      border-radius: var(--radius-full) !important;
      background: var(--surface-hover) !important;
      flex: 1;
    }

    :host ::ng-deep .achievement-progress-bar .p-progressbar-value {
      background: var(--primary-color) !important;
      border-radius: var(--radius-full) !important;
    }

    .achievement-progress-text {
      font-size: 0.625rem;
      color: var(--text-tertiary);
      white-space: nowrap;
    }

    .achievement-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.375rem;
    }

    .achievement-category {
      font-size: 0.625rem;
      color: var(--text-tertiary);
    }

    .achievement-xp {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--primary-color);
    }

    .achievements-empty {
      padding: 1.5rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      background: var(--surface-card);
      border-radius: var(--radius-md);
      margin: 0;
    }

    /* ==============================================================
       RESPONSIVE - Igual que social-page
       ============================================================== */

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .gamification-dashboard {
        padding: 0.75rem;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }

      .dashboard-header-stats {
        justify-content: center;
        width: 100%;
      }

      .level-summary {
        flex-direction: column;
        text-align: center;
      }

      .level-info-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .level-meta {
        justify-content: center;
      }

      .goal-item {
        flex-wrap: wrap;
      }

      .goal-actions {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.75rem;
      }

      .goal-xp {
        margin-bottom: 0;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-group {
        flex-wrap: wrap;
      }
    }

    @media (max-width: 480px) {
      .dashboard-header-stats {
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
      }

      .header-stat-divider {
        height: 1.5rem;
      }

      .level-avatar {
        width: 60px;
        height: 60px;
      }

      .level-avatar .level-number {
        font-size: 1.5rem;
      }

      .achievement-item {
        flex-wrap: wrap;
      }

      .achievement-icon-wrapper {
        width: 36px;
        height: 36px;
      }

      .achievement-icon-wrapper i {
        font-size: 0.875rem;
      }
    }
  `]
})
export class GamificationDashboardComponent implements OnInit {
  readonly i18n = inject(TranslocoService);
  private readonly gamificationService = inject(GamificationService);
  private readonly messageService = inject(MessageService);

  summary = signal<GamificationSummary | null>(null);
  achievements = signal<Achievement[]>([]);
  goals = signal<Goal[]>([]);
  loading = signal(true);

  // ============================================================
  // FILTROS - Usando signal para selectedCategories
  // ============================================================

  categories: AchievementCategory[] = [
    'PET',
    'SOCIAL',
    'SHOP',
    'PROFILE',
    'CARE',
    'ADOPTION',
    'STREAK',
  ];

  selectedCategories = signal<AchievementCategory[]>([]);

  // ============================================================
  // COMPUTED
  // ============================================================

  levelProgress = computed(() => {
    const s = this.summary();
    if (!s || s.xpToLevel <= 0) {
      return 0;
    }
    return Math.min(100, (s.currentLevelXp / s.xpToLevel) * 100);
  });

  dailyGoals = computed(() => this.goals().filter((g) => g.type === 'DAILY'));
  weeklyGoals = computed(() => this.goals().filter((g) => g.type === 'WEEKLY'));

  filteredAchievements = computed(() => {
    const all = this.achievements();
    const cats = this.selectedCategories();

    // Si no hay categorías seleccionadas, mostrar todos
    if (cats.length === 0) {
      return all;
    }

    // Filtrar por categorías seleccionadas
    return all.filter((a) => cats.includes(a.category));
  });

  // ============================================================
  // MÉTODOS
  // ============================================================

  goalProgress(goal: Goal): number {
    if (goal.targetValue <= 0) {
      return 0;
    }
    return Math.min(100, (goal.progress / goal.targetValue) * 100);
  }

  achievementProgress(a: Achievement): number {
    if (a.targetValue <= 0) {
      return 0;
    }
    return Math.min(100, (a.progress / a.targetValue) * 100);
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.gamificationService.getSummary().subscribe({
      next: (r) => this.summary.set(r),
      error: () => undefined,
    });
    this.gamificationService.getAchievements().subscribe({
      next: (r) => this.achievements.set(r),
      error: () => undefined,
    });
    this.gamificationService.getGoals().subscribe({
      next: (r) => {
        this.goals.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // ============================================================
  // FILTROS - CORREGIDOS
  // ============================================================

  toggleCategory(cat: AchievementCategory): void {
    this.selectedCategories.update((current) => {
      const index = current.indexOf(cat);
      if (index > -1) {
        // Si ya está seleccionada, la quitamos
        return current.filter((c) => c !== cat);
      } else {
        // Si no está seleccionada, la añadimos
        return [...current, cat];
      }
    });
  }

  clearFilters(): void {
    this.selectedCategories.set([]);
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('gamd.toastCleared'),
      detail: this.i18n.translate('gamd.toastClearedDetail'),
    });
  }

  // Este método ya no es necesario porque el filtrado es reactivo
  applyFilters(): void {
    // El filtrado es reactivo vía filteredAchievements()
  }

  claimGoal(code: string): void {
    this.gamificationService.claimGoal(code).subscribe({
      next: (res) => {
        this.goals.update((list) => list.map((g) => (g.code === res.goal.code ? res.goal : g)));
        this.summary.set(res.summary);
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.translate('gamd.toastClaimed'),
          detail: this.i18n.translate('gamd.toastClaimedDetail', { xp: res.xpGained }),
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.translate('gamd.toastError'),
          detail: this.i18n.translate('gamd.tryAgain'),
        });
      },
    });
  }

  rankTitleValue(): string {
    return this.summary()?.rankTitle || this.i18n.translate('gamd.defaultRank');
  }
}
