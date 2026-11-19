import { Component, inject, input, output, signal } from '@angular/core';
import type { OnChanges } from '@angular/core';
import { Supabase } from '../../../shared/services/supabase/supabase';
import type { SurveyDetails } from '../../../shared/services/supabase/survey-details';
import { DatePipe } from '@angular/common';

@Component({
  imports: [DatePipe],
  selector: 'main-survey-view',
  styleUrl: './survey-view.scss',
  templateUrl: './survey-view.html',
})
export class SurveyView implements OnChanges {
  readonly survey = signal<SurveyDetails | null>(null);
  readonly supabase = inject(Supabase);
  readonly newSurveyRequested = output<void>();
  readonly surveyId = input.required<string>();
  ngOnChanges(): void {
    if (this.surveyId()) {
      void this.loadSurveyDetails();
    }
  }

  private async loadSurveyDetails(): Promise<void> {
    const { data, error } = await this.supabase.getSurveyDetails(this.surveyId());
    if (error) {
      console.error('Survey konnte nicht geladen werden:', error.message);
      return;
    }
    this.survey.set(data);
  }
}
