export interface DashboardData {
  user: { id: string; name: string; hostel: string };
  stats: { total_reports: number; submitted_this_week: number; reviewed_total: number };
  today: {
    date: string; day: string; duty_warden: { id: string; name: string } | null;
    is_user_on_duty: boolean; report: string | null;
  } | null;
  week_recap: Record<string, unknown>[];
  week_progress: { date: string; status: string }[];
}

export interface RosterDay {
  date: string; day: string;
  putera: { id: string; name: string } | null;
  puteri: { id: string; name: string } | null;
}
