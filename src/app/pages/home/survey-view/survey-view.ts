import { Component, inject, input, output, signal } from '@angular/core';
import type { OnChanges } from '@angular/core';
import { Supabase } from '../../../shared/services/supabase/supabase';
import type { SurveyDetails } from '../../../shared/services/supabase/survey';
import { DatePipe } from '@angular/common';
import type { SurveyQuestion } from '../../../shared/services/supabase/survey-question';

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
  readonly questions = signal<SurveyQuestion[]>([]);
  ngOnChanges(): void {
    if (this.surveyId()) {
      void this.loadSurveyDetails();
      void this.loadSurveyQuestions();
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

  private async loadSurveyQuestions(): Promise<void> {
    const { data, error } = await this.supabase.getSurveyQuestions(this.surveyId());
    if (error) {
      console.error('Fragen konnten nicht geladen werden:', error.message);
      return;
    }
    this.questions.set(data ?? []);
  }

  answerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
