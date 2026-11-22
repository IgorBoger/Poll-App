import { Component, inject, input, output, signal } from '@angular/core';
import type { OnChanges } from '@angular/core';
import { Supabase } from '../../../shared/services/supabase/supabase';
import type { SurveyDetails } from '../../../shared/services/supabase/survey';
import { DatePipe } from '@angular/common';
import type { SurveyQuestion } from '../../../shared/services/supabase/survey-question';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [DatePipe, FormsModule],
  selector: 'main-survey-view',
  styleUrl: './survey-view.scss',
  templateUrl: './survey-view.html',
})
export class SurveyView implements OnChanges {
  readonly survey = signal<SurveyDetails | null>(null);
  readonly supabase = inject(Supabase);
  readonly newSurveyRequested = output<void>();
  readonly surveyCompleted = output<void>();
  readonly surveyId = input.required<string>();
  readonly questions = signal<SurveyQuestion[]>([]);
  readonly selectedAnswers = signal<Record<string, string[]>>({});
  readonly validationError = signal('');
  readonly isSubmitting = signal(false);
  readonly hasSubmitted = signal(false);

  ngOnChanges(): void {
    if (this.surveyId()) {
      void this.loadSurveyDetails();
      void this.loadSurveyQuestions();
      this.selectedAnswers.set(this.loadFromLocalStorageVotes());
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

  async onCompleteSurvey(): Promise<void> {
    if (this.isSubmitting() || this.hasSubmitted()) return;
    if (!this.areAllQuestionsAnswered()) {
      this.validationError.set('Please answer all questions.');
      return;
    }
    this.validationError.set('');
    const answerIds: string[] = Object.values(this.selectedAnswers()).flat();
    await this.saveVotes(answerIds);
  }

  private async saveVotes(answerIds: string[]): Promise<void> {
    this.isSubmitting.set(true);
    try {
      await this.supabase.submitSurveyVotes(this.surveyId(), answerIds);
      this.hasSubmitted.set(true);
      this.saveVotesToLocalStorage();
      this.surveyCompleted.emit();
    } catch (error: unknown) {
      const text: string = error instanceof Error ? error.message : 'Could not save your answers.';
      this.validationError.set(text);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private saveVotesToLocalStorage(): void {
    localStorage.setItem(`survey-vote-${this.surveyId()}`, JSON.stringify(this.selectedAnswers()));
  }

  private loadFromLocalStorageVotes(): Record<string, string[]> {
    const storedVotes = localStorage.getItem(`survey-vote-${this.surveyId()}`);
    const votes: Record<string, string[]> = storedVotes ? JSON.parse(storedVotes) : {};
    this.hasSubmitted.set(Object.keys(votes).length > 0);
    return votes;
  }

  onAnswerChange(question: SurveyQuestion, answerId: string, value: boolean | string): void {
    if (this.isSubmitting() || this.hasSubmitted()) return;
    const selected = this.selectedAnswers()[question.id] ?? [];
    let next: string[];
    if (question.allow_multiple_answers) {
      next = selected.filter((id) => id !== answerId);
      if (value === true) next.push(answerId);
    } else {
      next = [answerId];
    }
    this.selectedAnswers.update((current) => ({ ...current, [question.id]: next }));
  }

  private areAllQuestionsAnswered(): boolean {
    if (this.questions().length === 0) return false;
    return this.questions().every(
      (question) => (this.selectedAnswers()[question.id] ?? []).length > 0,
    );
  }
}
