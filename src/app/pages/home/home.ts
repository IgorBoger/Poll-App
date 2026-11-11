import { Component } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { Hero } from './hero/hero';
import { SurveyOverview } from './survey-overview/survey-overview';

@Component({
  imports: [Header, Hero, SurveyOverview],
  selector: 'main-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {}
