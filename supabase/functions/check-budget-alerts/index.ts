// Scheduled daily (see scripts/cron_jobs.sql). For every user with a budget,
// checks this month's expense total against their budget and emails them the
// first time they cross 80%, then again the first time they cross 100% —
// each threshold fires once per calendar month via last_alert_threshold /
// last_alert_sent on the budgets row.
import { wrapEmail } from "../_shared/emailLayout.ts";
import { sendEmail } from "../_shared/resend.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";

// Ordered highest-first so a user who jumps straight past 100% only gets the
// 100% email, not both.
const THRESHOLDS = [100, 80];

function startOfMonth() {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  ).toISOString();
}

function isSameMonth(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
}

Deno.serve(async () => {
  const supabase = createSupabaseAdmin();
  const now = new Date();

  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select("id, user_id, amount, last_alert_sent, last_alert_threshold");
  if (budgetsError) throw budgetsError;

  let sent = 0;

  for (const budget of budgets ?? []) {
    if (!budget.amount || budget.amount <= 0) continue;

    const { data: user } = await supabase
      .from("users")
      .select("email, name, currency")
      .eq("clerk_id", budget.user_id)
      .single();
    if (!user?.email) continue;

    const { data: expenseRows, error: expenseError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", budget.user_id)
      .eq("type", "EXPENSE")
      .gte("date", startOfMonth());
    if (expenseError) throw expenseError;

    const spent = (expenseRows ?? []).reduce((sum, tx) => sum + tx.amount, 0);
    const percent = (spent / budget.amount) * 100;

    // A previous alert only counts against this month's thresholds if it was
    // actually sent this month — a new month means every threshold resets.
    const alertedThisMonth =
      budget.last_alert_sent &&
        isSameMonth(new Date(budget.last_alert_sent), now)
        ? budget.last_alert_threshold
        : null;

    const threshold = THRESHOLDS.find(
      (t) => percent >= t && (alertedThisMonth === null || alertedThisMonth < t)
    );
    if (!threshold) continue;

    const currency = user.currency ?? "INR";
    const remaining = budget.amount - spent;
    const monthLabel = now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const subject =
      threshold >= 100
        ? "Lenvy Budget Alert: You've reached your monthly limit"
        : `Lenvy Budget Alert: ${threshold}% of your ${monthLabel} budget used`;

    const html = wrapEmail(`
      <p style="margin:0 0 16px;">Hi ${user.name ?? "there"},</p>
      <p style="margin:0 0 20px;">
        ${threshold >= 100
        ? `You've reached your <strong>${monthLabel}</strong> budget. Here's where things stand:`
        : `You've used <strong>${threshold}%</strong> of your <strong>${monthLabel}</strong> budget — sending this early so you can pace the rest of the month.`}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-variant-numeric:tabular-nums;">
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;color:#5B6572;font-size:13px;">Spent so far</td>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;text-align:right;font-weight:600;font-size:15px;">${spent.toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;color:#5B6572;font-size:13px;">Monthly budget</td>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;text-align:right;font-weight:600;font-size:15px;">${budget.amount.toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;color:#5B6572;font-size:13px;">${remaining >= 0 ? "Remaining" : "Over by"}</td>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;text-align:right;font-weight:600;font-size:15px;color:${remaining >= 0 ? "#0A0D12" : "#B8452F"};">${Math.abs(remaining).toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;color:#5B6572;font-size:13px;">Used</td>
          <td style="padding:10px 0;border-top:1px solid #EAE6DE;text-align:right;font-weight:600;font-size:15px;">${percent.toFixed(0)}%</td>
        </tr>
      </table>
      <p style="margin:0;color:#5B6572;font-size:14px;">
        ${threshold >= 100
        ? "Review your recent transactions in Lenvy to see what pushed you over. Consider adjusting your budget if it no longer fits your spending."
        : "You're on track. Keep an eye on the rest of the month to stay within budget."}
      </p>
    `);

    await sendEmail({ to: user.email, subject, html });

    const { error: updateError } = await supabase
      .from("budgets")
      .update({
        last_alert_sent: now.toISOString(),
        last_alert_threshold: threshold,
      })
      .eq("id", budget.id);
    if (updateError) throw updateError;

    sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
