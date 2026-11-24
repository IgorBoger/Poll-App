import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import type {
  InputSignal,
  OnChanges,
  OutputEmitterRef,
  Signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { switchMap, timer } from 'rxjs';
import type { Subscription } from 'rxjs';

import { Supabase } from '../../../shared/services/supabase/supabase';
import type { SurveyDetails } from '../../../shared/services/supabase/survey';
import type { SurveyQuestion } from '../../../shared/services/supabase/survey-question';

const DEADLINE_CHECK_INTERVAL_MS: number = 1000;
const FIRST_ANSWER_CHAR_CODE: number = 65;
const PERCENTAGE_SCALE: number = 100;

@Component({
  imports: [DatePipe, FormsModule],
  selector: 'main-survey-view',
  styleUrls: ['./survey-view.scss', '../../../responsive/home/survey-view.responsive.scss'],
  templateUrl: './survey-view.html',
})
export class SurveyView implements OnChanges {
  private readonly destroyRef: DestroyRef = inject(DestroyRef);
  private voteSubscription: Subscription | null = null;
  private readonly currentTime: WritableSignal<number> = signal(Date.now());
  readonly survey: WritableSignal<SurveyDetails | null> = signal<SurveyDetails | null>(null);
  readonly supabase: Supabase = inject(Supabase);
  readonly newSurveyRequested: OutputEmitterRef<void> = output<void>();
  readonly surveyCompleted: OutputEmitterRef<void> = output<void>();
  readonly closeRequested: OutputEmitterRef<void> = output<void>();
  readonly surveyId: InputSignal<string> = input.required<string>();
  readonly questions: WritableSignal<SurveyQuestion[]> = signal<SurveyQuestion[]>([]);
  readonly selectedAnswers: WritableSignal<Record<string, string[]>> = signal<
    Record<string, string[]>
  >({});
  readonly validationError: WritableSignal<string> = signal('');
  readonly isSubmitting: WritableSignal<boolean> = signal(false);
  readonly hasSubmitted: WritableSignal<boolean> = signal(false);
  readonly resultsExpanded: WritableSignal<boolean> = signal(true);
  readonly isExpired: Signal<boolean> = computed(() => this.hasDeadlinePassed(this.currentTime()));
  readonly votingDisabled: Signal<boolean> = computed(
    () => !this.survey() || this.isExpired() || this.isSubmitting() || this.hasSubmitted(),
  );

  constructor() {
    timer(0, DEADLINE_CHECK_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.currentTime.set(Date.now()));
  }

  private hasDeadlinePassed(now: number): boolean {
    const deadline: string | null | undefined = this.survey()?.ends_at;
    return deadline != null && Date.parse(deadline) <= now;
  }

  ngOnChanges(): void {
    this.voteSubscription?.unsubscribe();
    if (this.surveyId()) {
      void this.loadSurveyDetails();
      void this.loadSurveyQuestions();
      this.selectedAnswers.set(this.loadFromLocalStorageVotes());
    }
  }

  private async loadSurveyDetails(): Promise<void> {
    const { data, error }: PostgrestSingleResponse<SurveyDetails> =
      await this.supabase.getSurveyDetails(this.surveyId());
    if (error) {
      console.error('Survey konnte nicht geladen werden:', error.message);
      return;
    }
    this.survey.set(data);
  }

  private async loadSurveyQuestions(): Promise<void> {
    const surveyId: string = this.surveyId();
    const { data, error }: PostgrestSingleResponse<SurveyQuestion[]> =
      await this.supabase.getSurveyQuestions(surveyId);
    if (this.destroyRef.destroyed || surveyId !== this.surveyId()) return;
    if (error) {
      console.error('Fragen konnten nicht geladen werden:', error.message);
      return;
    }
    this.questions.set(data ?? []);
    this.watchSurveyVotes(surveyId);
  }

  /** Refreshes results on vote changes without changing the participant's selection. */
  private watchSurveyVotes(surveyId: string): void {
    const questionIds: string[] = this.questions().map((question) => question.id);
    this.voteSubscription = this.supabase
      .watchSurveyVotes(questionIds)
      .pipe(
        switchMap(() => this.supabase.getSurveyQuestions(surveyId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ data, error }) => {
        if (!error && surveyId === this.surveyId()) this.questions.set(data ?? []);
      });
  }

  totalVotes(question: SurveyQuestion): number {
    return question.answers.reduce((sum, answer) => sum + answer.vote_count, 0);
  }

  answerPercentage(question: SurveyQuestion, voteCount: number): number {
    const total: number = this.totalVotes(question);
    return total > 0 ? Math.round((voteCount / total) * PERCENTAGE_SCALE) : 0;
  }

  hasVotes(): boolean {
    return this.questions().some((question) => this.totalVotes(question) > 0);
  }

  answerLetter(index: number): string {
    return String.fromCharCode(FIRST_ANSWER_CHAR_CODE + index);
  }

  async onCompleteSurvey(): Promise<void> {
    if (this.votingDisabled() || this.hasDeadlinePassed(Date.now())) return;
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
    const storedVotes: string | null = localStorage.getItem(`survey-vote-${this.surveyId()}`);
    const votes: Record<string, string[]> = storedVotes ? JSON.parse(storedVotes) : {};
    this.hasSubmitted.set(Object.keys(votes).length > 0);
    return votes;
  }

  onAnswerChange(question: SurveyQuestion, answerId: string, value: boolean | string): void {
    if (this.votingDisabled() || this.hasDeadlinePassed(Date.now())) return;
    const selected: string[] = this.selectedAnswers()[question.id] ?? [];
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
