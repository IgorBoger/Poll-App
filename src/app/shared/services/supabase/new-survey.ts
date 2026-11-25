/**
 * Describes the client payload used to create a survey with questions and answer options.
 */
export interface NewSurvey {
  title: string;
  category: string;
  description: string | null;
  endsAt: string | null;
  questions: {
    text: string;
    answers: string[];
    allowMultipleAnswers: boolean;
  }[];
}
