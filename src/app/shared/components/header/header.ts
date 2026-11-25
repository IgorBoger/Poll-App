import { Component, input, output, InputSignal, OutputEmitterRef } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Displays the application logo and emits requests to return home.
 */
@Component({
  imports: [RouterLink],
  selector: 'main-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  readonly darkLogo: InputSignal<boolean> = input(false);
  readonly homeRequested: OutputEmitterRef<void> = output<void>();
}
