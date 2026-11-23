export interface SurveyAnswerOption {
  id: string;
  question_id: string;
  text: string;
  position: number | null;
  vote_count: number;
}
