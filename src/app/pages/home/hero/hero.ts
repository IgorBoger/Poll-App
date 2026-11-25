import { Component, output, OutputEmitterRef } from '@angular/core';

/**
 * Displays the home-screen introduction and emits requests to create a survey.
 */
@Component({
  imports: [],
  selector: 'main-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  readonly newSurveyRequested: OutputEmitterRef<void> = output<void>();
}
