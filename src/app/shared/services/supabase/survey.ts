/**
 * Contains the survey fields displayed in lists and highlight cards.
 */
export interface Survey {
  id: string;
  title: string;
  category: string;
  ends_at: string | null;
}

/**
 * Extends the survey list fields with the optional description.
 */
export interface SurveyDetails extends Survey {
  description: string | null;
}
