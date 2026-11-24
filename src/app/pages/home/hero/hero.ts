import { Component, output, OutputEmitterRef } from '@angular/core';

@Component({
  imports: [],
  selector: 'main-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  readonly newSurveyRequested: OutputEmitterRef<void> = output<void>();
}
