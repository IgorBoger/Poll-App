import { Component, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';

import { Header } from '../../shared/components/header/header';
import { Hero } from './hero/hero';
import { SurveyForm } from './survey-form/survey-form';
import { SurveyList } from './survey-list/survey-list';
import { SurveyOverview } from './survey-overview/survey-overview';
import { SurveyView } from './survey-view/survey-view';

@Component({
  imports: [Header, Hero, SurveyOverview, SurveyList, SurveyForm, SurveyView],
  selector: 'main-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  readonly isSurveyFormOpen: WritableSignal<boolean> = signal(false);
  readonly selectedSurveyId: WritableSignal<string> = signal('');

  onSurveyPublished(surveyId: string): void {
    this.selectedSurveyId.set(surveyId);
    this.isSurveyFormOpen.set(false);
  }

  onCancel(): void {
    this.selectedSurveyId.set('');
    this.isSurveyFormOpen.set(false);
  }
}
