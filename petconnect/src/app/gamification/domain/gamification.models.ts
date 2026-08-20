export type AchievementCategory =
  | 'PET'
  | 'SOCIAL'
  | 'SHOP'
  | 'PROFILE'
  | 'CARE'
  | 'ADOPTION'
  | 'STREAK';

export type AchievementState = 'LOCKED' | 'UNLOCKED' | 'CLAIMED';
export type GoalType = 'DAILY' | 'WEEKLY';

export interface GamificationSummary {
  level: number;
  currentLevelXp: number;
  xpToLevel: number;
  totalXp: number;
  rankTitle: string;
  streakDays: number;
  dailyXpEarned: number;
  dailyXpLimit: number;
  dailyXpDate: string | null;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  progress: number;
  targetValue: number;
  xpReward: number;
  state: AchievementState;
  canClaim: boolean;
  unlockedAt: string | null;
}

export interface Goal {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  type: GoalType;
  progress: number;
  targetValue: number;
  xpReward: number;
  claimed: boolean;
  canClaim: boolean;
  periodStart: string;
  periodEnd: string;
}

export interface ClaimResult {
  goal: Goal;
  summary: GamificationSummary;
  xpGained: number;
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  PET: 'Mascotas',
  SOCIAL: 'Comunidad',
  SHOP: 'Mercado',
  PROFILE: 'Perfil',
  CARE: 'Cuidado',
  ADOPTION: 'Adopción',
  STREAK: 'Constancia',
};