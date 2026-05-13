"use server";

import { transporter } from "@/lib/nodemailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { convertReferral } from "@/server-actions/referrals";

export async function submitRegionWaitlist(input: {
  region: string;
  voterEmail?: string;
  referralCode?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const region = input.region?.trim();
  const voterEmail = input.voterEmail?.trim();
  const referralCode = input.referralCode?.trim();

  if (!region) {
    return { ok: false, error: "Please enter a city." };
  }

  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("region_requests")
    .select("id, vote_count")
    .eq("region", region)
    .maybeSingle();

  let requestId: number | null = null;
  if (existing) {
    await admin
      .from("region_requests")
      .update({ vote_count: (existing.vote_count ?? 0) + 1 })
      .eq("id", existing.id);
    requestId = existing.id;
  } else {
    const { data: inserted } = await admin
      .from("region_requests")
      .insert({ region, vote_count: 1 })
      .select("id")
      .single();
    requestId = inserted?.id ?? null;
  }

  if (requestId && voterEmail) {
    await admin.from("region_votes").insert({
      request_id: requestId,
      voter_email: voterEmail,
      referral_code: referralCode || null,
    });
  }

  if (referralCode) {
    await convertReferral(referralCode, voterEmail || "", { region });
  }

  const lines = [
    "New region waitlist request (Next Voters)",
    "",
    `Region: ${region}`,
    ...(voterEmail ? [`Voter: ${voterEmail}`] : []),
    ...(referralCode ? [`Referral code: ${referralCode}`] : []),
  ];

  const user = process.env.EMAIL_USER;
  if (!user) {
    return { ok: true };
  }

  try {
    await transporter.sendMail({
      from: `Next Voters <${user}>`,
      to: user,
      subject: `[Next Voters] Region request: ${region}`,
      text: lines.join("\n"),
      html: `<pre style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">${lines
        .map((l) => (l === "" ? "<br/>" : l))
        .join("<br/>")}</pre>`,
    });
  } catch {
    // Admin email is best-effort; the DB write above is the source of truth.
  }
  return { ok: true };
}
