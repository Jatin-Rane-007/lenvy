export type Budget = {
  id: string;
  user_id: string;
  amount: number;
  last_alert_sent: string | null;
  /** Last budget-usage % (80 or 100) an email alert was sent for; resets each calendar month. */
  last_alert_threshold: number | null;
  created_at: string;
  updated_at: string;
};
