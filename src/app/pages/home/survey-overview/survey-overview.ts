import { Component, inject, output, signal } from '@angular/core';
import type { OnInit, OutputEmitterRef, WritableSignal } from '@angular/core';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

import { Supabase } from '../../../shared/services/supabase/supabase';
import type { Survey } from '../../../shared/services/supabase/survey';

const DAY_IN_MS: number = 24 * 60 * 60 * 1000;
const WHEEL_LINE_HEIGHT_PX: number = 16;
const SCROLL_EDGE_TOLERANCE_PX: number = 1;

@Component({
  imports: [],
  selector: 'main-survey-overview',
  styleUrl: './survey-overview.scss',
  templateUrl: './survey-overview.html',
})
export class SurveyOverview implements OnInit {
  private readonly supabase: Supabase = inject(Supabase);
  private readonly loadedAt: number = Date.now();
  readonly surveyRequested: OutputEmitterRef<string> = output<string>();
  protected readonly surveyHighlights: WritableSignal<Survey[]> = signal<Survey[]>([]);
  protected readonly status: WritableSignal<'loading' | 'ready' | 'error'> = signal<
    'loading' | 'ready' | 'error'
  >('loading');

  ngOnInit(): void {
    void this.loadSurveyHighlights();
  }

  private async loadSurveyHighlights(): Promise<void> {
    const { data, error }: PostgrestSingleResponse<Survey[]> =
      await this.supabase.getSurveyHighlights(this.loadedAt);
    this.surveyHighlights.set(data ?? []);
    this.status.set(error ? 'error' : 'ready');
  }

  protected formatDeadline(endsAt: string | null): string {
    if (endsAt === null) {
      return 'No deadline';
    }
    const days: number = Math.ceil((Date.parse(endsAt) - this.loadedAt) / DAY_IN_MS);
    return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`;
  }

  scrollCardsWithWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      return;
    }
    const cards: HTMLElement = event.currentTarget as HTMLElement;
    if (!this.canScrollCards(cards, event.deltaY)) {
      return;
    }
    event.preventDefault();
    cards.scrollLeft += this.getWheelOffset(event, cards.clientWidth);
  }

  private canScrollCards(cards: HTMLElement, deltaY: number): boolean {
    const maxScroll: number = cards.scrollWidth - cards.clientWidth;
    return (
      maxScroll > 0 &&
      (deltaY > 0 ? cards.scrollLeft < maxScroll - SCROLL_EDGE_TOLERANCE_PX : cards.scrollLeft > 0)
    );
  }

  private getWheelOffset(event: WheelEvent, pageWidth: number): number {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return event.deltaY * WHEEL_LINE_HEIGHT_PX;
    }
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return event.deltaY * pageWidth;
    }
    return event.deltaY;
  }
}
