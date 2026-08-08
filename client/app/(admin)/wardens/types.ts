export interface Warden {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  hostel: string | null;
  status: string;
  report_count: number;
  last_submission: string | null;
}

export interface AddWardenPayload {
  email: string;
  name: string;
  hostel: string;
}
