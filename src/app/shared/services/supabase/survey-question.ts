import type { SurveyAnswerOption } from './survey-answer-option';

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  text: string;
  position: number | null;
  allow_multiple_answers: boolean | null;
  answers: SurveyAnswerOption[];
}
