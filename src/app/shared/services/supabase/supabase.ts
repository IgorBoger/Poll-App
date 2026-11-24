import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import type {
  PostgrestSingleResponse,
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  SupabaseClient,
} from '@supabase/supabase-js';
import { Observable } from 'rxjs';

import type { NewSurvey } from './new-survey';
import type { Survey, SurveyDetails } from './survey';
import type { SurveyAnswerOption } from './survey-answer-option';
import type { SurveyQuestion } from './survey-question';

const ENDING_SOON_WINDOW_MS: number = 7 * 24 * 60 * 60 * 1000;
const HIGHLIGHT_LIMIT: number = 3;
const SURVEY_QUESTIONS_SELECT: string = `
  id, survey_id, text, position, allow_multiple_answers,
  answers:survey_answer_options(id, question_id, text, position, vote_count)
`;

type SurveyCreateResponse = PostgrestSingleResponse<string>;

@Injectable()
export class Supabase {
  supabaseUrl: string = 'https://eowabjsykssvvxmczlwy.supabase.co';
  supabaseKey: string = 'sb_publishable_7w6aAfv7c6X_I0FHwOOnDQ_cMYIZVA4';
  private readonly supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey);

  watchSurveyVotes(questionIds: string[]): Observable<void> {
    return new Observable<void>((subscriber) => {
      if (questionIds.length === 0) return;
      const channel: RealtimeChannel = this.createVoteChannel(questionIds, () => subscriber.next());
      return () => void this.supabase.removeChannel(channel);
    });
  }

  private createVoteChannel(questionIds: string[], notify: () => void): RealtimeChannel {
    const channel: RealtimeChannel = this.supabase.channel(`survey-votes-${crypto.randomUUID()}`);
    const filter: RealtimePostgresChangesFilter<'UPDATE'> = this.getVoteChangeFilter(questionIds);
    return channel
      .on<SurveyAnswerOption>('postgres_changes', filter, notify)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') notify();
      });
  }

  private getVoteChangeFilter(questionIds: string[]): RealtimePostgresChangesFilter<'UPDATE'> {
    return {
      event: 'UPDATE',
      schema: 'public',
      table: 'survey_answer_options',
      filter: `question_id=in.(${questionIds.join(',')})`,
    };
  }

  async createSurvey(survey: NewSurvey): Promise<string> {
    const { data, error }: SurveyCreateResponse = await this.supabase.rpc('create_survey', {
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

  async getSurveyQuestions(surveyId: string): Promise<PostgrestSingleResponse<SurveyQuestion[]>> {
    return this.supabase
      .from('survey_questions')
      .select(SURVEY_QUESTIONS_SELECT)
      .eq('survey_id', surveyId)
      .order('position', { nullsFirst: false })
      .order('id')
      .order('position', { referencedTable: 'answers', nullsFirst: false })
      .order('id', { referencedTable: 'answers' })
      .overrideTypes<SurveyQuestion[], { merge: false }>();
  }

  async submitSurveyVotes(surveyId: string, answerIds: string[]): Promise<void> {
    const { error }: PostgrestSingleResponse<null> = await this.supabase.rpc(
      'submit_survey_votes',
      {
        p_survey_id: surveyId,
        p_answer_ids: answerIds,
      },
    );
    if (error) {
      throw new Error(error.message);
    }
  }
}
