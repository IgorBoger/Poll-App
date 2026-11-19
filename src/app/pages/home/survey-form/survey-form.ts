import { Component, inject, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Supabase } from '../../../shared/services/supabase/supabase';
import type { NewSurvey } from '../../../shared/services/supabase/new-survey';

@Component({
  imports: [FormsModule],
  selector: 'main-survey-form',
  styleUrls: [
    './survey-form.scss',
    './survey-form-category.scss',
    '../../../responsive/home/survey-form.responsive.scss',
  ],
  templateUrl: './survey-form.html',
})
export class SurveyForm {
  private readonly supabase = inject(Supabase);
  readonly isSaving = signal(false);
  readonly isPublished = signal(false);
  readonly saveError = signal('');
  readonly cancelRequested = output<void>();
  readonly publishedConfirmed = output<string>();
  private nextQuestionId = 2;

  questions = [
    {
      id: 1,
      text: '',
      answers: ['', ''],
      allowMultipleAnswers: false,
    },
  ];

  createdSurveyId = '';
  surveyName = '';
  surveyDeadline = '';
  surveyDescription = '';
  surveyCategory = '';

  readonly categories = [
    'Gaming & entertainment',
    'Health & wellness',
    'Technology & innovation',
    'Lifestyle & preferences',
    'Team activities',
    'Education & learning',
  ];

  onCancelClick() {
    this.cancelRequested.emit();
  }

  onNextQuestionClick() {
    const nextId = this.nextQuestionId;
    this.nextQuestionId += 1;
    this.questions.push({
      id: nextId,
      text: '',
      answers: ['', ''],
      allowMultipleAnswers: false,
    });
  }

  onAddAnswerClick(question: { answers: string[] }) {
    if (question.answers.length >= 6) return;
    question.answers.push('');
  }

  answerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  onDeleteQuestion(questionIndex: number) {
    if (questionIndex === 0) {
      this.questions[0].text = '';
      this.questions[0].allowMultipleAnswers = false;
      this.questions[0].answers.fill('');
      return;
    }
    this.questions.splice(questionIndex, 1);
  }

  onDeleteAnswer(question: { answers: string[] }, answerIndex: number) {
    if (question.answers.length <= 2) {
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
    const buttonBounds = publishButton.getBoundingClientRect();
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
