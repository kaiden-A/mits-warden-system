export interface AnalyticsData {
  week_start: string;
  week: {
    date: string;
    status_counts: { draft: number; submitted: number; reviewed: number; flagged: number };
    late: number;
    total: number;
  }[];
  sections: {
    section_id: string;
    avg: { overall: number | null; putera: number | null; puteri: number | null };
    distribution: Record<string, number>;
    unrated: number;
    total: number;
  }[];
}
