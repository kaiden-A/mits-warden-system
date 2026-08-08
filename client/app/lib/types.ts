export interface ReportPerson {
  id: string;
  name: string;
}

export interface ReportRatings {
  [sectionId: string]: { [key: string]: string };
}

export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'flagged';

export interface ReportDetail {
  id: string;
  date: string;
  hostel: string;
  status: ReportStatus;
  inspection_time?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  flagged_at?: string | null;
  submitted_by?: ReportPerson | null;
  submitted_by_name?: string;
  reviewed_by?: ReportPerson | null;
  flagged_by?: ReportPerson | null;
  duty_warden?: ReportPerson | null;
  duty_warden_name?: string | null;
  is_substitution?: boolean;
  is_late?: boolean;
  rated_sections?: number;
  admin_note?: string | null;
  ratings?: ReportRatings;
  aduan_kerosakan?: string;
  murid_sakit?: string;
  kawalan_keselamatan?: string | number | null;
  catatan_tambahan?: string;
}
