// 사용자 목표(모드)
export type Goal = "tracking" | "ttc" | "pregnant";

// 생리 양
export type Flow = "none" | "light" | "medium" | "heavy" | "very_heavy";

// 성생활(피임 여부)
export type Intercourse = "none" | "protected" | "unprotected";

export interface Profile {
  id: string;
  display_name: string | null;
  goal: Goal;
  avg_cycle_length: number;
  avg_period_length: number;
  created_at: string;
}

export interface Period {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  flow: Flow;
  intercourse: Intercourse;
  symptoms: string[];
  mood: string | null;
  note: string | null;
}

export interface Pregnancy {
  id: string;
  user_id: string;
  lmp_date: string; // 마지막 생리 시작일
  due_date: string; // 출산예정일 (EDD)
  status: "active" | "ended";
  created_at: string;
}

export type PartnerLinkStatus = "pending" | "accepted";

export interface PartnerLink {
  id: string;
  owner_id: string;
  partner_id: string | null;
  status: PartnerLinkStatus;
  invite_code: string;
  created_at: string;
}

export interface NotificationPrefs {
  user_id: string;
  period_reminder: boolean;
  ovulation_reminder: boolean;
  fertile_window_reminder: boolean;
  log_reminder: boolean;
  partner_fertile_alert: boolean;
  reminder_hour: number; // 0-23, 알림 발송 시각
}
