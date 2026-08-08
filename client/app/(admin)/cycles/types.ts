export interface Warden {
  id: string;
  name: string;
  hostel: string;
  status: string;
}

export interface Pair {
  name: string;
  putera_warden_id: string;
  puteri_warden_id: string;
}

export interface ExcludedDate {
  date: string;
  reason: string;
}

export interface CycleSummary {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface CycleEntry {
  id: string;
  date: string;
  pair_name: string | null;
  putera: { id: string; name: string } | null;
  puteri: { id: string; name: string } | null;
}

export interface CycleDetail extends CycleSummary {
  pairs: Pair[];
  excluded_dates: ExcludedDate[];
  entries: CycleEntry[];
}

export interface CycleEntryEdit {
  putera_warden_id?: string;
  puteri_warden_id?: string;
}

export interface SignatureBlock {
  label: string;
  name: string;
  position: string;
}

export interface CreateCyclePayload {
  name: string;
  start_date: string;
  end_date: string;
  pairs: Pair[];
  excluded_dates: ExcludedDate[];
}
