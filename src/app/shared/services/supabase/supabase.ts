import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import type { SurveyListItem } from './survey-list-item';
import type { SurveyHighlight } from './survey-highlight';

const ENDING_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const HIGHLIGHT_LIMIT = 3;

@Injectable()
export class Supabase {
  supabaseUrl = 'https://eowabjsykssvvxmczlwy.supabase.co';
  supabaseKey = 'sb_publishable_7w6aAfv7c6X_I0FHwOOnDQ_cMYIZVA4';
  private readonly supabase = createClient(this.supabaseUrl, this.supabaseKey);

  async getSurveyHighlights(from: number): Promise<PostgrestSingleResponse<SurveyHighlight[]>> {
    const deadlineLimit: number = from + ENDING_SOON_WINDOW_MS;
    return this.supabase
      .from('surveys')
      .select('id, title, category, ends_at')
      .gt('ends_at', new Date(from).toISOString())
      .lte('ends_at', new Date(deadlineLimit).toISOString())
      .order('ends_at')
      .order('id')
      .limit(HIGHLIGHT_LIMIT)
      .overrideTypes<SurveyHighlight[], { merge: false }>();
  }

  async getSurveys(): Promise<PostgrestSingleResponse<SurveyListItem[]>> {
    return this.supabase
      .from('surveys')
      .select('id, title, category, ends_at')
      .order('created_at', { ascending: false })
      .order('id')
      .overrideTypes<SurveyListItem[], { merge: false }>();
  }
}
