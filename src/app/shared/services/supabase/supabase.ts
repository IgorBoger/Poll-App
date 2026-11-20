import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import type { Survey, SurveyDetails } from './survey';
import type { NewSurvey } from './new-survey';

const ENDING_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const HIGHLIGHT_LIMIT = 3;

@Injectable()
export class Supabase {
  supabaseUrl = 'https://eowabjsykssvvxmczlwy.supabase.co';
  supabaseKey = 'sb_publishable_7w6aAfv7c6X_I0FHwOOnDQ_cMYIZVA4';
  private readonly supabase = createClient(this.supabaseUrl, this.supabaseKey);

  async createSurvey(survey: NewSurvey): Promise<string> {
    const { data, error } = await this.supabase.rpc('create_survey', {
      p_title: survey.title,
      p_category: survey.category,
      p_description: survey.description,
      p_ends_at: survey.endsAt,
      p_questions: survey.questions,
    });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async getSurveyHighlights(from: number): Promise<PostgrestSingleResponse<Survey[]>> {
    const deadlineLimit: number = from + ENDING_SOON_WINDOW_MS;
    return this.supabase
      .from('surveys')
      .select('id, title, category, ends_at')
      .gt('ends_at', new Date(from).toISOString())
      .lte('ends_at', new Date(deadlineLimit).toISOString())
      .order('ends_at')
      .order('id')
      .limit(HIGHLIGHT_LIMIT)
      .overrideTypes<Survey[], { merge: false }>();
  }

  async getSurveys(): Promise<PostgrestSingleResponse<Survey[]>> {
    return this.supabase
      .from('surveys')
      .select('id, title, category, ends_at')
      .order('created_at', { ascending: false })
      .order('id')
      .overrideTypes<Survey[], { merge: false }>();
  }

  async getSurveyDetails(surveyId: string): Promise<PostgrestSingleResponse<SurveyDetails>> {
    return this.supabase
      .from('surveys')
      .select('id, title, category, description, ends_at')
      .eq('id', surveyId)
      .single()
      .overrideTypes<SurveyDetails, { merge: false }>();
  }
}
