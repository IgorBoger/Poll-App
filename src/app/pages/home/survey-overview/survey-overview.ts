import { Component, inject, output, signal } from '@angular/core';
import type { OnInit, OutputEmitterRef, WritableSignal } from '@angular/core';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

import { Supabase } from '../../../shared/services/supabase/supabase';
import type { Survey } from '../../../shared/services/supabase/survey';

const DAY_IN_MS: number = 24 * 60 * 60 * 1000;
const WHEEL_LINE_HEIGHT_PX: number = 16;
const SCROLL_EDGE_TOLERANCE_PX: number = 1;

/**
 * Displays the ending-soon survey cards and their horizontal scrolling behavior.
 */
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

  /**
   * Starts loading ending-soon surveys when the overview is initialized.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    void this.loadSurveyHighlights();
  }

  /**
   * Loads ending-soon surveys using the time captured when the overview was created.
   *
   * @returns {Promise<void>} Resolves after the highlighted surveys and loading status are updated.
   */
  private async loadSurveyHighlights(): Promise<void> {
    const { data, error }: PostgrestSingleResponse<Survey[]> =
      await this.supabase.getSurveyHighlights(this.loadedAt);
    this.surveyHighlights.set(data ?? []);
    this.status.set(error ? 'error' : 'ready');
  }

  /**
   * Formats days remaining relative to the overview load time, or a missing deadline.
   *
   * @param {string | null} endsAt - Survey deadline, or null when the survey has no end date.
   * @returns {string} The remaining-day label or the no-deadline label.
   */
  protected formatDeadline(endsAt: string | null): string {
    if (endsAt === null) {
      return 'No deadline';
    }
    const days: number = Math.ceil((Date.parse(endsAt) - this.loadedAt) / DAY_IN_MS);
    return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`;
  }

  /**
   * Converts eligible vertical wheel movement into horizontal card scrolling.
   *
   * @param {WheelEvent} event - Wheel event originating from the scrollable card list.
   * @returns {void}
   */
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

  /**
   * Checks whether the card list can scroll in the requested wheel direction.
   *
   * @param {HTMLElement} cards - Scrollable container holding the survey cards.
   * @param {number} deltaY - Vertical wheel delta indicating the requested direction.
   * @returns {boolean} Whether further horizontal scrolling is possible in that direction.
   */
  private canScrollCards(cards: HTMLElement, deltaY: number): boolean {
    const maxScroll: number = cards.scrollWidth - cards.clientWidth;
    return (
      maxScroll > 0 &&
      (deltaY > 0 ? cards.scrollLeft < maxScroll - SCROLL_EDGE_TOLERANCE_PX : cards.scrollLeft > 0)
    );
  }

  /**
   * Converts pixel, line, or page wheel deltas into a horizontal pixel offset.
   *
   * @param {WheelEvent} event - Wheel event containing the delta and its unit.
   * @param {number} pageWidth - Container width used to convert page-based deltas.
   * @returns {number} The horizontal scroll distance in pixels.
   */
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
