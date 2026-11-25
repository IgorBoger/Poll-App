import { Component, inject, output, signal } from '@angular/core';
import type { OutputEmitterRef, WritableSignal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

import { Header } from '../../../shared/components/header/header';
import type { NewSurvey } from '../../../shared/services/supabase/new-survey';
import { Supabase } from '../../../shared/services/supabase/supabase';

const MIN_ANSWERS: number = 2;
const MAX_ANSWERS: number = 6;
const FIRST_ANSWER_CHAR_CODE: number = 65;

/**
 * Manages survey creation, field validation, and publication confirmation.
 */
@Component({
  imports: [FormsModule, Header],
  selector: 'main-survey-form',
  styleUrls: [
    './survey-form.scss',
    './survey-form-publish.scss',
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

  /**
   * Requests that the parent close the survey creation form.
   *
   * @returns {void}
   */
  onCancelClick(): void {
    this.cancelRequested.emit();
  }

  /**
   * Appends an empty question with a unique local identifier and two answers.
   *
   * @returns {void}
   */
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

  /**
   * Appends an empty answer unless the question already has the maximum number.
   *
   * @param {{answers: string[]}} question - Question whose answer fields are extended.
   * @returns {void}
   */
  onAddAnswerClick(question: { answers: string[] }): void {
    if (question.answers.length >= MAX_ANSWERS) return;
    question.answers.push('');
  }

  /**
   * Returns the uppercase letter assigned to an answer option.
   *
   * @param {number} index - Zero-based index of the answer option.
   * @returns {string} The corresponding uppercase answer letter.
   */
  answerLetter(index: number): string {
    return String.fromCharCode(FIRST_ANSWER_CHAR_CODE + index);
  }

  /**
   * Clears the first question or removes a later question from the form.
   *
   * @param {number} questionIndex - Zero-based index of the question to clear or remove.
   * @returns {void}
   */
  onDeleteQuestion(questionIndex: number): void {
    if (questionIndex === 0) {
      this.questions[0].text = '';
      this.questions[0].allowMultipleAnswers = false;
      this.questions[0].answers.fill('');
      return;
    }
    this.questions.splice(questionIndex, 1);
  }

  /**
   * Clears an answer at the minimum count or removes an additional answer.
   *
   * @param {{answers: string[]}} question - Question containing the answer field.
   * @param {number} answerIndex - Zero-based index of the answer to clear or remove.
   * @returns {void}
   */
  onDeleteAnswer(question: { answers: string[] }, answerIndex: number): void {
    if (question.answers.length <= MIN_ANSWERS) {
      question.answers[answerIndex] = '';
      return;
    }
    question.answers.splice(answerIndex, 1);
  }

  /**
   * Marks invalid fields as touched or saves a valid, unpublished survey.
   *
   * @param {NgForm} form - Creation form containing the current validation state.
   * @param {HTMLButtonElement} publishButton - Button used to position the publication confirmation.
   * @param {HTMLDialogElement} publishedDialog - Confirmation dialog opened after the survey is saved.
   * @returns {Promise<void>} Resolves when validation or the save attempt finishes.
   */
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

  /**
   * Builds the survey payload, including the optional local end-of-day deadline.
   *
   * @returns {NewSurvey} The survey data passed to the database service.
   */
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

  /**
   * Saves the survey, opens its confirmation, and records any save error.
   *
   * @param {HTMLButtonElement} button - Publish button used as the confirmation position reference.
   * @param {HTMLDialogElement} dialog - Confirmation dialog displayed after successful publication.
   * @returns {Promise<void>} Resolves after the save attempt and saving-state cleanup.
   */
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

  /**
   * Positions the publication confirmation relative to the publish button and opens it.
   *
   * @param {HTMLButtonElement} publishButton - Button whose bounds determine the dialog position.
   * @param {HTMLDialogElement} publishedDialog - Publication confirmation to position and open.
   * @returns {void}
   */
  private openPublishedDialog(
    publishButton: HTMLButtonElement,
    publishedDialog: HTMLDialogElement,
  ): void {
    const buttonBounds: DOMRect = publishButton.getBoundingClientRect();
    publishedDialog.style.setProperty('--publish-right', `${buttonBounds.right}px`);
    publishedDialog.style.setProperty('--publish-bottom', `${buttonBounds.bottom}px`);
    publishedDialog.showModal();
  }

  /**
   * Emits the created survey identifier when its publication confirmation closes.
   *
   * @returns {void}
   */
  onPublishedDialogClose(): void {
    if (this.createdSurveyId) {
      this.publishedConfirmed.emit(this.createdSurveyId);
    }
  }
}
