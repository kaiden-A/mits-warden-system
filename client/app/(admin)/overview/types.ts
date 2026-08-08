export interface AdminDashboard {
  stats: {
    active_wardens: number;
    pending_review_this_week: number;
    reviewed_this_week: number;
    flagged_total: number;
  };
  recent_entries: {
    id: string;
    date: string;
    hostel: string;
    warden_name: string;
    status: string;
    inspection_time: string | null;
    submitted_at: string | null;
  }[];
}
