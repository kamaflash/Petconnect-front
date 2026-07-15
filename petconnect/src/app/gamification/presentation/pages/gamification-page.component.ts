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

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  date?: string;
  category: 'social' | 'care' | 'exploration' | 'special';
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
  ],
  providers: [MessageService],
  template: `
    <div class="gamification-page">
      <!-- Header -->
      <div class="gamification-header">
        <div class="header-content">
          <div class="header-left">
            <h3>Logros y Niveles</h3>
            <p>Tu progreso en la comunidad</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{{ userStats().level }}</span>
              <span class="stat-label">Nivel</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ userStats().totalXP.toLocaleString() }}</span>
              <span class="stat-label">XP Total</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ userStats().achievementsUnlocked }}/{{ userStats().totalAchievements }}</span>
              <span class="stat-label">Logros</span>
            </div>
          </div>
        </div>
      </div>

      <div class="gamification-container">
        <!-- Sidebar Filters -->
        <aside class="filters-sidebar">
          <div class="filter-section">
            <h3>Categoría</h3>
            <div class="filter-options">
              @for (category of categories; track category) {
                <div class="filter-option">
                  <p-checkbox
                    [inputId]="category.value"
                    [value]="category.value"
                    [(ngModel)]="selectedCategories"
                    (onChange)="applyFilters()"
                  />
                  <label [for]="category.value">{{ category.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="filter-section">
            <h3>Estado</h3>
            <div class="filter-options">
              <div class="filter-option">
                <p-checkbox
                  inputId="unlocked"
                  [(ngModel)]="filters.unlockedOnly"
                  (onChange)="applyFilters()"
                />
                <label for="unlocked">Solo desbloqueados</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="locked"
                  [(ngModel)]="filters.lockedOnly"
                  (onChange)="applyFilters()"
                />
                <label for="locked">Solo bloqueados</label>
              </div>
            </div>
          </div>

          <button class="clear-filters-btn" (click)="clearFilters()">
            <i class="pi pi-times"></i>
            Limpiar filtros
          </button>
        </aside>

        <!-- Main Content -->
        <main class="achievements-main">
          <!-- Level Progress Card -->
          <div class="level-progress-card">
            <div class="level-info">
              <div class="level-badge">
                <span class="level-number">{{ userStats().level }}</span>
              </div>
              <div class="level-details">
                <h2>Nivel {{ userStats().level }} - {{ userStats().rank }}</h2>
                <p class="xp-info">{{ userStats().currentXP.toLocaleString() }} / {{ userStats().nextLevelXP.toLocaleString() }} XP</p>
                <p-progressBar [value]="levelProgress()" [style]="{'height': '12px'}" />
              </div>
            </div>
            <div class="level-stats">
              <div class="level-stat">
                <span class="stat-label-small">XP para siguiente nivel</span>
                <span class="stat-value-small">{{ xpToNextLevel() }} XP</span>
              </div>
            </div>
          </div>

          <!-- Results count -->
          <div class="results-header">
            <div class="results-count">
              {{ filteredAchievements().length }} logro{{ filteredAchievements().length !== 1 ? 's' : '' }} encontrado{{ filteredAchievements().length !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- Achievements Grid -->
          <div class="achievements-grid">
            @for (achievement of filteredAchievements(); track achievement.id) {
              <div class="achievement-card" [class.unlocked]="achievement.unlocked">
                <div class="achievement-icon" [class.unlocked]="achievement.unlocked">
                  <span class="icon-emoji">{{ achievement.icon }}</span>
                  @if (achievement.unlocked) {
                    <div class="unlocked-badge">
                      <i class="pi pi-check"></i>
                    </div>
                  }
                </div>
                <div class="achievement-content">
                  <h3>{{ achievement.name }}</h3>
                  <p class="achievement-description">{{ achievement.description }}</p>
                  <div class="achievement-footer">
                    <span class="xp-reward">+{{ achievement.xp }} XP</span>
                    <p-tag
                      [value]="achievement.unlocked ? 'Desbloqueado' : 'Bloqueado'"
                      [severity]="achievement.unlocked ? 'success' : 'secondary'"
                    />
                  </div>
                  @if (achievement.unlocked && achievement.date) {
                    <span class="achievement-date">
                      <i class="pi pi-calendar"></i>
                      {{ achievement.date }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>

          @if (filteredAchievements().length === 0) {
            <div class="no-achievements">
              <i class="pi pi-trophy"></i>
              <p>No se encontraron logros con estos criterios</p>
              <button class="clear-filters-btn" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .gamification-page {
      min-height: 100vh;
      background: var(--surface-bg);
    }

    /* Header */
    .gamification-header {
      padding: 2rem 0;
      margin-bottom: 2rem;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: white;
    }

    .header-left p {
      margin: 0.25rem 0 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 2rem;
      background: rgba(255, 255, 255, 0.15);
      padding: 1rem 2rem;
      border-radius: var(--radius-md);
      backdrop-filter: blur(10px);
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 400;
      color: white;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .stat-divider {
      width: 1px;
      height: 3rem;
      background: rgba(255, 255, 255, 0.3);
    }

    /* Container */
    .gamification-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem 2rem;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }

    /* Filters Sidebar */
    .filters-sidebar {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 1rem;
    }

    .filter-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .filter-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .filter-section h3 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .filter-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-option label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .clear-filters-btn {
      width: 100%;
      padding: 0.75rem;
      background: none;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .clear-filters-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    /* Main Content */
    .achievements-main {
      min-height: 600px;
    }

    /* Level Progress Card */
    .level-progress-card {
      border-radius: var(--radius-md);
      padding: 2rem;
      margin-bottom: 2rem;
      color: white;
    }

    .level-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .level-badge {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .level-number {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .level-details {
      flex: 1;
    }

    .level-details h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .xp-info {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .level-stats {
      display: flex;
      gap: 2rem;
    }

    .level-stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label-small {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .stat-value-small {
      font-size: 1.25rem;
      font-weight: 700;
    }

    /* Results Header */
    .results-header {
      margin-bottom: 1.5rem;
    }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Achievements Grid */
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .achievement-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      transition: all var(--transition-fast);
      border: 2px solid transparent;
    }

    .achievement-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .achievement-card.unlocked {
      border-color: #10b981;
    }

    .achievement-icon {
      width: 64px;
      height: 64px;
      background: var(--surface-hover);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      margin-bottom: 1rem;
      position: relative;
    }

    .achievement-icon.unlocked {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    }

    .unlocked-badge {
      position: absolute;
      bottom: -4px;
      right: -4px;
      width: 24px;
      height: 24px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      border: 2px solid var(--surface-card);
    }

    .achievement-content h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .achievement-description {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .achievement-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .xp-reward {
      font-weight: 600;
      color: var(--primary-color);
      font-size: 0.875rem;
    }

    .achievement-date {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .achievement-date i {
      font-size: 0.875rem;
    }

    .no-achievements {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .no-achievements i {
      font-size: 3rem;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .no-achievements p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0 0 1rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .gamification-container {
        grid-template-columns: 1fr;
      }

      .filters-sidebar {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-stats {
        width: 100%;
        justify-content: center;
      }

      .level-info {
        flex-direction: column;
        text-align: center;
      }

      .achievements-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GamificationPageComponent {
  private messageService = inject(MessageService);

  // Filters
  categories = [
    { label: 'Social', value: 'social' },
    { label: 'Cuidado', value: 'care' },
    { label: 'Exploración', value: 'exploration' },
    { label: 'Especial', value: 'special' }
  ];
  selectedCategories: string[] = [];
  filters = {
    unlockedOnly: false,
    lockedOnly: false
  };

  // User Stats
  userStats = signal<UserStats>({
    level: 12,
    currentXP: 650,
    nextLevelXP: 1000,
    totalXP: 2450,
    achievementsUnlocked: 12,
    totalAchievements: 100,
    rank: 'Experto en Mascotas'
  });

  // Computed
  levelProgress = computed(() => {
    const stats = this.userStats();
    return (stats.currentXP / stats.nextLevelXP) * 100;
  });

  xpToNextLevel = computed(() => {
    const stats = this.userStats();
    return stats.nextLevelXP - stats.currentXP;
  });

  filteredAchievements = computed(() => {
    let result = [...this.achievements()];

    // Category filter
    if (this.selectedCategories.length > 0) {
      result = result.filter(a => this.selectedCategories.includes(a.category));
    }

    // Status filters
    if (this.filters.unlockedOnly) {
      result = result.filter(a => a.unlocked);
    }
    if (this.filters.lockedOnly) {
      result = result.filter(a => !a.unlocked);
    }

    return result;
  });

  // Achievements data
  achievements = signal<Achievement[]>([
    {
      id: '1',
      name: 'Primer paso',
      description: 'Registra tu primera mascota',
      icon: '🎖️',
      xp: 50,
      unlocked: true,
      date: '15/03/2024',
      category: 'exploration'
    },
    {
      id: '2',
      name: 'Amante de los animales',
      description: 'Registra 3 mascotas',
      icon: '🐾',
      xp: 100,
      unlocked: true,
      date: '20/04/2024',
      category: 'care'
    },
    {
      id: '3',
      name: 'Cuidador responsable',
      description: 'Completa 10 citas médicas',
      icon: '💉',
      xp: 150,
      unlocked: false,
      category: 'care'
    },
    {
      id: '4',
      name: 'Social',
      description: 'Haz 50 publicaciones',
      icon: '📱',
      xp: 200,
      unlocked: false,
      category: 'social'
    },
    {
      id: '5',
      name: 'Explorador',
      description: 'Visita 5 lugares diferentes',
      icon: '🗺️',
      xp: 100,
      unlocked: true,
      date: '10/05/2024',
      category: 'exploration'
    },
    {
      id: '6',
      name: 'Campeón',
      description: 'Gana un concurso',
      icon: '🏆',
      xp: 300,
      unlocked: false,
      category: 'special'
    },
    {
      id: '7',
      name: 'Compañero fiel',
      description: 'Participa en 10 eventos',
      icon: '🤝',
      xp: 250,
      unlocked: true,
      date: '05/06/2024',
      category: 'social'
    },
    {
      id: '8',
      name: 'Héroe anónimo',
      description: 'Adopta una mascota',
      icon: '💚',
      xp: 500,
      unlocked: false,
      category: 'special'
    }
  ]);

  // Methods
  applyFilters() {
    // Filters are applied automatically via computed property
  }

  clearFilters() {
    this.selectedCategories = [];
    this.filters = {
      unlockedOnly: false,
      lockedOnly: false
    };
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han restablecido todos los filtros'
    });
  }
}
