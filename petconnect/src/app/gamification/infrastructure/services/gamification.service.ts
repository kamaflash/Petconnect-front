import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Achievement,
  ClaimResult,
  GamificationSummary,
  Goal,
} from '../../domain/gamification.models';

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSummary(): Observable<GamificationSummary> {
    return this.http.get<GamificationSummary>(`${this.apiUrl}/gamification/summary`);
  }

  getAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/gamification/achievements`);
  }

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/gamification/goals`);
  }

  claimGoal(goalCode: string): Observable<ClaimResult> {
    return this.http.post<ClaimResult>(
      `${this.apiUrl}/gamification/goals/${goalCode}/claim`,
      null
    );
  }
}