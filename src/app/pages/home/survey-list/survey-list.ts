import { Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { Supabase } from '../../../shared/services/supabase/supabase';
import type { SurveyListItem } from '../../../shared/services/supabase/survey-list-item';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'main-survey-list',
  styleUrl: './survey-list.scss',
  templateUrl: './survey-list.html',
})
export class SurveyList implements OnInit {
  private readonly supabase = inject(Supabase);
  protected readonly surveys = signal<SurveyListItem[]>([]);
  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly selectedStatus = signal<'active' | 'past'>('active');
  protected readonly visibleSurveys = computed(() => {
    const showPast = this.selectedStatus() === 'past';
    const now = Date.now();

    return this.surveys().filter((survey) => {
      const hasEnded = survey.ends_at !== null && Date.parse(survey.ends_at) <= now;
      return hasEnded === showPast;
    });
  });

  ngOnInit(): void {
    void this.loadSurveys();
  }

  private async loadSurveys(): Promise<void> {
    const { data, error } = await this.supabase.getSurveys();
    this.surveys.set(data ?? []);
    this.status.set(error ? 'error' : 'ready');
  }

  protected formatDeadline(endsAt: string): string {
    const remainingMs: number = Date.parse(endsAt) - Date.now();
    if (remainingMs <= 0) {
      return 'Ended';
    }

    const days: number = Math.ceil(remainingMs / DAY_IN_MS);
    return days === 1 ? 'Ends in 1 day' : `Ends in ${days} days`;
  }
}
