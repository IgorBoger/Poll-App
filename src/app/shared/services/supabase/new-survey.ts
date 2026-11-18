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
