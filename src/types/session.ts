import type { PageData } from '../components/TimesheetForm';

export interface Session {
  readonly id: string;
  readonly user_id: string;
  readonly title: string;
  readonly pages: PageData[];
  readonly hourly_rate: string | null;
  readonly total_hours: number | null;
  readonly total_pay: number | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SessionInsert {
  readonly title: string;
  readonly pages: PageData[];
  readonly hourly_rate: string | null;
  readonly total_hours: number | null;
  readonly total_pay: number | null;
}
