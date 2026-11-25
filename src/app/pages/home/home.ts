import { DOCUMENT } from '@angular/common';
import { Component, HostListener, inject, signal, viewChild } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';

import { Header } from '../../shared/components/header/header';
import { Hero } from './hero/hero';
import { SurveyForm } from './survey-form/survey-form';
import { SurveyList } from './survey-list/survey-list';
import { SurveyOverview } from './survey-overview/survey-overview';
import { SurveyView } from './survey-view/survey-view';

/**
 * Coordinates the home screen, survey creation overlay, and selected survey view.
 */
@Component({
  imports: [Header, Hero, SurveyOverview, SurveyList, SurveyForm, SurveyView],
  selector: 'main-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly document: Document = inject(DOCUMENT);
  private readonly surveyForm: Signal<SurveyForm | undefined> = viewChild(SurveyForm);
  private readonly surveyView: Signal<SurveyView | undefined> = viewChild(SurveyView);
  readonly isSurveyFormOpen: WritableSignal<boolean> = signal(false);
  readonly selectedSurveyId: WritableSignal<string> = signal('');

  /**
   * Closes the active survey overlay with Escape while preserving native dialog handling.
   *
   * @param {Event} event - Escape key event received by the document.
   * @returns {void}
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.defaultPrevented || event.repeat || event.isComposing) return;
    if (this.document.querySelector('dialog[open]')) return;
    const form: SurveyForm | undefined = this.surveyForm();
    const survey: SurveyView | undefined = this.surveyView();
    if (!form && !survey) return;
    event.preventDefault();
    if (form) form.onCancelClick();
    else survey?.closeRequested.emit();
  }

  /**
   * Opens the newly published survey and closes the creation form.
   *
   * @param {string} surveyId - Identifier of the newly created survey.
   * @returns {void}
   */
  onSurveyPublished(surveyId: string): void {
    this.selectedSurveyId.set(surveyId);
    this.isSurveyFormOpen.set(false);
  }

  /**
   * Closes the survey detail view and the creation form.
   *
   * @returns {void}
   */
  onCancel(): void {
    this.selectedSurveyId.set('');
    this.isSurveyFormOpen.set(false);
  }
}
