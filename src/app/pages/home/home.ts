import { Component } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { Hero } from './hero/hero';

@Component({
  imports: [Header, Hero],
  selector: 'main-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {}
