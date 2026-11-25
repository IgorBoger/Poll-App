import { Component, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';

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
  readonly isSurveyFormOpen: WritableSignal<boolean> = signal(false);
  readonly selectedSurveyId: WritableSignal<string> = signal('');

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
