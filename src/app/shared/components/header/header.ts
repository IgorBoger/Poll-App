import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'main-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  readonly homeRequested = output<void>();
}
