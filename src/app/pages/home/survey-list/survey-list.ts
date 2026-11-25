import { Component, computed, inject, output, signal } from '@angular/core';
import type { OnInit, OutputEmitterRef, Signal, WritableSignal } from '@angular/core';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

import { Supabase } from '../../../shared/services/supabase/supabase';
import type { Survey } from '../../../shared/services/supabase/survey';

const DAY_IN_MS: number = 24 * 60 * 60 * 1000;

/**
 * Displays surveys filtered by active or past status and category.
 */
@Component({
  selector: 'main-survey-list',
  styleUrl: './survey-list.scss',
  templateUrl: './survey-list.html',
})
export class SurveyList implements OnInit {
  private readonly supabase: Supabase = inject(Supabase);
  protected readonly surveys: WritableSignal<Survey[]> = signal<Survey[]>([]);
  protected readonly status: WritableSignal<'loading' | 'ready' | 'error'> = signal<
    'loading' | 'ready' | 'error'
  >('loading');
  protected readonly selectedStatus: WritableSignal<'active' | 'past'> = signal<'active' | 'past'>(
    'active',
  );
  protected readonly selectedCategoryLabel: WritableSignal<string> = signal('');
  protected readonly categories: Signal<string[]> = computed(() => {
    const categories: string[] = this.surveys().map((survey) => survey.category);
    return [...new Set(categories)].sort((first, second) => first.localeCompare(second, 'en'));
  });
  protected readonly visibleSurveys: Signal<Survey[]> = computed(() => {
    const showPast: boolean = this.selectedStatus() === 'past';
    const category: string = this.selectedCategoryLabel();
    const now: number = Date.now();

    return this.surveys().filter((survey) => {
      const hasEnded: boolean = survey.ends_at !== null && Date.parse(survey.ends_at) <= now;
      const matchesCategory: boolean = category === '' || survey.category === category;
      return hasEnded === showPast && matchesCategory;
    });
  });
  readonly surveyRequested: OutputEmitterRef<string> = output<string>();

  /**
   * Starts loading the surveys when the list is initialized.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    void this.loadSurveys();
  }

  /**
   * Loads the survey list and records whether loading succeeded or failed.
   *
   * @returns {Promise<void>} Resolves after the survey data and loading status are updated.
   */
  private async loadSurveys(): Promise<void> {
    const { data, error }: PostgrestSingleResponse<Survey[]> = await this.supabase.getSurveys();
    this.surveys.set(data ?? []);
    this.status.set(error ? 'error' : 'ready');
  }

  /**
   * Formats the remaining time as rounded-up days or marks an elapsed deadline.
   *
   * @param {string} endsAt - Survey deadline in a date format accepted by Date.parse.
   * @returns {string} The remaining-day label or the ended label.
   */
  protected formatDeadline(endsAt: string): string {
    const remainingMs: number = Date.parse(endsAt) - Date.now();
    if (remainingMs <= 0) {
      return 'Ended';
    }

    const days: number = Math.ceil(remainingMs / DAY_IN_MS);
    return days === 1 ? 'Ends in 1 day' : `Ends in ${days} days`;
  }
}
