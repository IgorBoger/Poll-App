export interface Survey {
  id: string;
  title: string;
  category: string;
  ends_at: string | null;
}

export interface SurveyDetails extends Survey {
  description: string | null;
}
