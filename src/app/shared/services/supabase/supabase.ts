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

/**
 * Describes the database response containing a newly created survey identifier.
 */
type SurveyCreateResponse = PostgrestSingleResponse<string>;

/**
 * Provides survey database queries, voting operations, and realtime subscriptions.
 */
@Injectable()
export class Supabase {
  supabaseUrl: string = 'https://eowabjsykssvvxmczlwy.supabase.co';
  supabaseKey: string = 'sb_publishable_7w6aAfv7c6X_I0FHwOOnDQ_cMYIZVA4';
  private readonly supabase: SupabaseClient = createClient(this.supabaseUrl, this.supabaseKey);

  /**
   * Creates a stream of vote-change and connection-ready notifications for the supplied questions.
   *
   * @param {string[]} questionIds - Question identifiers used to filter realtime answer updates.
   * @returns {Observable<void>} A stream that opens a channel on subscription and removes it on unsubscription.
   */
  watchSurveyVotes(questionIds: string[]): Observable<void> {
    return new Observable<void>((subscriber) => {
      if (questionIds.length === 0) return;
      const channel: RealtimeChannel = this.createVoteChannel(questionIds, () => subscriber.next());
      return () => void this.supabase.removeChannel(channel);
    });
  }

  /**
   * Subscribes to filtered answer updates and refreshes results when the connection is ready.
   *
   * @param {string[]} questionIds - Question identifiers whose answer changes are observed.
   * @param {() => void} notify - Callback invoked on answer updates and successful connections.
   * @returns {RealtimeChannel} The subscribed Supabase realtime channel.
   */
  private createVoteChannel(questionIds: string[], notify: () => void): RealtimeChannel {
    const channel: RealtimeChannel = this.supabase.channel(`survey-votes-${crypto.randomUUID()}`);
    const filter: RealtimePostgresChangesFilter<'UPDATE'> = this.getVoteChangeFilter(questionIds);
    return channel
      .on<SurveyAnswerOption>('postgres_changes', filter, notify)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') notify();
      });
  }

  /**
   * Restricts realtime updates to answer options belonging to the supplied questions.
   *
   * @param {string[]} questionIds - Question identifiers included in the update filter.
   * @returns {RealtimePostgresChangesFilter<'UPDATE'>} The table, event, schema, and question filter for the subscription.
   */
  private getVoteChangeFilter(questionIds: string[]): RealtimePostgresChangesFilter<'UPDATE'> {
    return {
      event: 'UPDATE',
      schema: 'public',
      table: 'survey_answer_options',
      filter: `question_id=in.(${questionIds.join(',')})`,
    };
  }

  /**
   * Creates a survey and its questions and answers through the database function.
   *
   * @param {NewSurvey} survey - Validated survey payload to persist.
   * @returns {Promise<string>} Resolves to the identifier of the newly created survey.
   * @throws {Error} When the database rejects the creation request.
   */
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

  /**
   * Queries up to three surveys ending within seven days, with the earliest deadline first.
   *
   * @param {number} from - Start of the ending-soon window in Unix epoch milliseconds.
   * @returns {Promise<PostgrestSingleResponse<Survey[]>>} Resolves to the highlighted surveys or the database error response.
   */
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

  /**
   * Queries surveys ordered by creation time, newest first, with an identifier tie-breaker.
   *
   * @returns {Promise<PostgrestSingleResponse<Survey[]>>} Resolves to the survey list or the database error response.
   */
  async getSurveys(): Promise<PostgrestSingleResponse<Survey[]>> {
    return this.supabase
      .from('surveys')
      .select('id, title, category, ends_at')
      .order('created_at', { ascending: false })
      .order('id')
      .overrideTypes<Survey[], { merge: false }>();
  }

  /**
   * Queries the details of a single survey by its identifier.
   *
   * @param {string} surveyId - Identifier of the survey to retrieve.
   * @returns {Promise<PostgrestSingleResponse<SurveyDetails>>} Resolves to the survey details or the database error response.
   */
  async getSurveyDetails(surveyId: string): Promise<PostgrestSingleResponse<SurveyDetails>> {
    return this.supabase
      .from('surveys')
      .select('id, title, category, description, ends_at')
      .eq('id', surveyId)
      .single()
      .overrideTypes<SurveyDetails, { merge: false }>();
  }

  /**
   * Queries a survey's questions and answer options in their stored display order.
   *
   * @param {string} surveyId - Identifier of the survey whose questions are retrieved.
   * @returns {Promise<PostgrestSingleResponse<SurveyQuestion[]>>} Resolves to the ordered questions and answers or the database error response.
   */
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

  /**
   * Submits selected answer identifiers through the database voting function.
   *
   * @param {string} surveyId - Identifier of the survey receiving the votes.
   * @param {string[]} answerIds - Identifiers of the selected answer options.
   * @returns {Promise<void>} Resolves when the database has accepted the votes.
   * @throws {Error} When the database rejects the submission.
   */
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
