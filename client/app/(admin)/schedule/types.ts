export interface RosterDay {
  date: string;
  day: string;
  putera: { id: string; name: string } | null;
  puteri: { id: string; name: string } | null;
}

export interface RosterData {
  week_start: string;
  days: RosterDay[];
}
