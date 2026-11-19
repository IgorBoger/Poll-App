import { Component, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'main-survey-view',
  styleUrl: './survey-view.scss',
  templateUrl: './survey-view.html',
})
export class SurveyView {
  readonly newSurveyRequested = output<void>();

  constructor() {
    console.log('SurveyView initialized');
  }
}
