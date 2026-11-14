import { Component, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'main-survey-form',
  styleUrls: ['./survey-form.scss', '../../../responsive/home/survey-form.responsive.scss'],
  templateUrl: './survey-form.html',
})
export class SurveyForm {
  readonly cancelRequested = output<void>();

  questions = [
    {
      id: 1,
      text: '',
      answers: ['', ''],
      allowMultipleAnswers: false,
    },
  ];

  onCancelClick() {
    this.cancelRequested.emit();
  }

  onNextQuestionClick() {
    const nextId = this.questions.length + 1;
    this.questions.push({
      id: nextId,
      text: '',
      answers: ['', ''],
      allowMultipleAnswers: false,
    });
  }
}
