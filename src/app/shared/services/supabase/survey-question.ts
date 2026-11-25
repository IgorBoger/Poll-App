import type { SurveyAnswerOption } from './survey-answer-option';

/**
 * Represents a stored survey question with its ordered answer options.
 */
export interface SurveyQuestion {
  id: string;
  survey_id: string;
  text: string;
  position: number | null;
  allow_multiple_answers: boolean | null;
  answers: SurveyAnswerOption[];
}
