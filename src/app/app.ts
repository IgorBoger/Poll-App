import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Hosts the application router outlet.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
