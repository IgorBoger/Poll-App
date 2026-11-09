import { Component } from '@angular/core';
import { Header } from '../../shared/components/header/header';

@Component({
  imports: [ Header],
  selector: 'main-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {}
