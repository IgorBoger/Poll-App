import { Component, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'main-survey-form',
  styleUrls: ['./survey-form.scss', '../../../responsive/home/survey-form.responsive.scss'],
  templateUrl: './survey-form.html',
})
export class SurveyForm {
  readonly cancelRequested = output<void>();

  onCancelClick() {
    this.cancelRequested.emit();
  }
}
