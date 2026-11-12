import { Component, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'main-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  readonly newSurveyRequested = output<void>();
}
