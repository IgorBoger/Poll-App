import { Component, signal } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { Hero } from './hero/hero';
import { SurveyOverview } from './survey-overview/survey-overview';
import { SurveyList } from './survey-list/survey-list';
import { SurveyForm } from './survey-form/survey-form';
import { SurveyView } from './survey-view/survey-view';

@Component({
  imports: [Header, Hero, SurveyOverview, SurveyList, SurveyForm, SurveyView],
  selector: 'main-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  readonly isSurveyFormOpen = signal(false);
  readonly selectedSurveyId = signal('');

  onSurveyPublished(surveyId: string): void {
    this.selectedSurveyId.set(surveyId);
    this.isSurveyFormOpen.set(false);
  }

  onCancel() {
    this.selectedSurveyId.set('');
    this.isSurveyFormOpen.set(false);
  }
}
