import { Component, inject, output, signal } from '@angular/core';
import type { OutputEmitterRef, WritableSignal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { Header } from '../../../shared/components/header/header';
import type { NewSurvey } from '../../../shared/services/supabase/new-survey';
import { Supabase } from '../../../shared/services/supabase/supabase';

const MIN_ANSWERS: number = 2;
const MAX_ANSWERS: number = 6;
const FIRST_ANSWER_CHAR_CODE: number = 65;

@Component({
  imports: [FormsModule, Header],
  selector: 'main-survey-form',
  styleUrls: [
    './survey-form.scss',
    './survey-form-category.scss',
    '../../../responsive/home/survey-form.responsive.scss',
  ],
  templateUrl: './survey-form.html',
})
export class SurveyForm {
  private readonly supabase: Supabase = inject(Supabase);
  readonly isSaving: WritableSignal<boolean> = signal(false);
  readonly isPublished: WritableSignal<boolean> = signal(false);
  readonly saveError: WritableSignal<string> = signal('');
  readonly cancelRequested: OutputEmitterRef<void> = output<void>();
  readonly publishedConfirmed: OutputEmitterRef<string> = output<string>();
  private nextQuestionId: number = 2;

  questions: (NewSurvey['questions'][number] & { id: number })[] = [
    {
      id: 1,
      text: '',
      answers: ['', ''],
      allowMultipleAnswers: false,
    },
  ];

  createdSurveyId: string = '';
  surveyName: string = '';
  surveyDeadline: string = '';
  surveyDescription: string = '';
  surveyCategory: string = '';

  readonly categories: string[] = [
    'Gaming & entertainment',
    'Health & wellness',
    'Technology & innovation',
    'Lifestyle & preferences',
    'Team activities',
    'Education & learning',
  ];

  onCancelClick(): void {
    this.cancelRequested.emit();
  }

  onNextQuestionClick(): void {
    const nextId: number = this.nextQuestionId;
    this.nextQuestionId += 1;
    this.questions.push({
      id: nextId,
      text: '',
      answers: ['', ''],
      allowMultipleAnswers: false,
    });
  }

  onAddAnswerClick(question: { answers: string[] }): void {
    if (question.answers.length >= MAX_ANSWERS) return;
    question.answers.push('');
  }

  answerLetter(index: number): string {
    return String.fromCharCode(FIRST_ANSWER_CHAR_CODE + index);
  }

  onDeleteQuestion(questionIndex: number): void {
    if (questionIndex === 0) {
      this.questions[0].text = '';
      this.questions[0].allowMultipleAnswers = false;
      this.questions[0].answers.fill('');
      return;
    }
    this.questions.splice(questionIndex, 1);
  }

  onDeleteAnswer(question: { answers: string[] }, answerIndex: number): void {
    if (question.answers.length <= MIN_ANSWERS) {
      question.answers[answerIndex] = '';
      return;
    }
    question.answers.splice(answerIndex, 1);
  }

  async onPublish(
    form: NgForm,
    publishButton: HTMLButtonElement,
    publishedDialog: HTMLDialogElement,
  ): Promise<void> {
    if (this.isSaving() || this.isPublished()) return;
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    await this.saveSurvey(publishButton, publishedDialog);
  }

  private getSurveyData(): NewSurvey {
    return {
      title: this.surveyName,
      category: this.surveyCategory,
      description: this.surveyDescription.trim() || null,
      endsAt: this.surveyDeadline
        ? new Date(`${this.surveyDeadline}T23:59:59.999`).toISOString()
        : null,
      questions: this.questions,
    };
  }

  private async saveSurvey(button: HTMLButtonElement, dialog: HTMLDialogElement): Promise<void> {
    this.isSaving.set(true);
    this.saveError.set('');
    try {
      this.createdSurveyId = await this.supabase.createSurvey(this.getSurveyData());
      this.isPublished.set(true);
      this.openPublishedDialog(button, dialog);
    } catch (error: unknown) {
      this.saveError.set(error instanceof Error ? error.message : 'Could not save the survey.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private openPublishedDialog(
    publishButton: HTMLButtonElement,
    publishedDialog: HTMLDialogElement,
  ): void {
    const buttonBounds: DOMRect = publishButton.getBoundingClientRect();
    publishedDialog.style.setProperty('--publish-right', `${buttonBounds.right}px`);
    publishedDialog.style.setProperty('--publish-bottom', `${buttonBounds.bottom}px`);
    publishedDialog.showModal();
  }

  onPublishedDialogClose(): void {
    if (this.createdSurveyId) {
      this.publishedConfirmed.emit(this.createdSurveyId);
    }
  }
}
