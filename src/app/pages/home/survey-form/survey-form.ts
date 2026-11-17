import { Component, isDevMode, output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'main-survey-form',
  styleUrls: ['./survey-form.scss', '../../../responsive/home/survey-form.responsive.scss'],
  templateUrl: './survey-form.html',
})
export class SurveyForm {
  readonly cancelRequested = output<void>();
  private nextQuestionId = 2;
  questions = [
    {
      id: 1,
      text: '',
      answers: ['', ''],
      allowMultipleAnswers: false,
    },
  ];
  surveyName = '';
  surveyDeadline = '';
  surveyDescription = '';

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

  onPublish(form: NgForm, publishButton: HTMLButtonElement, publishedDialog: HTMLDialogElement) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    if (isDevMode()) {
      this.openPublishedDialog(publishButton, publishedDialog);
    }
  }

  private openPublishedDialog(
    publishButton: HTMLButtonElement,
    publishedDialog: HTMLDialogElement,
  ) {
    const buttonBounds = publishButton.getBoundingClientRect();
    publishedDialog.style.setProperty('--publish-right', `${buttonBounds.right}px`);
    publishedDialog.style.setProperty('--publish-bottom', `${buttonBounds.bottom}px`);
    publishedDialog.showModal();
  }
}
