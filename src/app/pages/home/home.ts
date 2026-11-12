import { Component, signal } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { Hero } from './hero/hero';
import { SurveyOverview } from './survey-overview/survey-overview';
import { SurveyList } from './survey-list/survey-list';
import { SurveyForm } from './survey-form/survey-form';

@Component({
  imports: [Header, Hero, SurveyOverview, SurveyList, SurveyForm],
  selector: 'main-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  readonly isSurveyFormOpen = signal(false);
}
