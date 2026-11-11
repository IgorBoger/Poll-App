import { Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';

import { Supabase } from '../../../shared/services/supabase/supabase';
import type { SurveyHighlight } from '../../../shared/services/supabase/survey-highlight';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Component({
  imports: [],
  selector: 'main-survey-overview',
  styleUrl: './survey-overview.scss',
  templateUrl: './survey-overview.html',
})
export class SurveyOverview implements OnInit {
  private readonly supabase = inject(Supabase);
  private readonly loadedAt: number = Date.now();

  protected readonly surveyHighlights = signal<SurveyHighlight[]>([]);
  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  ngOnInit(): void {
    void this.loadSurveyHighlights();
  }

  private async loadSurveyHighlights(): Promise<void> {
    const { data, error } = await this.supabase.getSurveyHighlights(this.loadedAt);
    this.surveyHighlights.set(data ?? []);
    this.status.set(error ? 'error' : 'ready');
  }

  protected formatDeadline(endsAt: string): string {
    const days: number = Math.ceil((Date.parse(endsAt) - this.loadedAt) / DAY_IN_MS);
    return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`;
  }
}
