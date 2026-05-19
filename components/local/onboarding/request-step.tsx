"use client";

import { useEffect, useState } from "react";
import { Link2, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearPendingAction, writePendingAction } from "@/lib/pending-action";
import { submitRegionWaitlist } from "@/server-actions/request-region";
import { getOrCreateReferralCode } from "@/server-actions/referrals";
import { getRegionVoteCount } from "@/server-actions/get-region-vote-count";
import { buildReferralLink } from "@/lib/referral";
import { OnboardingState } from "./types";

interface Props {
  state: OnboardingState;
  referralCode: string | null;
  onContinue: () => void;
}

export function RequestStep({ state, referralCode, onContinue }: Props) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestedRegion = state.regionRequest?.region ?? "";

  const handleAuthedSubmit = async () => {
    setError(null);
    if (!user?.email) {
      setError("Please sign in to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitRegionWaitlist({
        region: requestedRegion,
        voterEmail: user.email,
        referralCode: referralCode || undefined,
      });
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      onContinue();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    // Carry requested region via cookie (see lib/pending-action.ts for why).
    writePendingAction({
      type: "request",
      region: requestedRegion,
      referralCode: referralCode || null,
    });
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/local/onboarding")}`,
      },
    });
    if (oauthError) {
      clearPendingAction();
      setError(oauthError.message);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
        We don&rsquo;t cover{" "}
        <span className="font-semibold text-gray-900">{requestedRegion}</span> yet. Sign in
        with Google and we&rsquo;ll email you the moment it launches.
      </p>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="mb-4 text-red-700 text-[13px] bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      {user ? (
        <button
          type="button"
          onClick={handleAuthedSubmit}
          disabled={submitting}
          className="w-full sm:w-auto sm:min-w-[240px] inline-flex items-center justify-center min-h-[48px] px-8 py-3 text-[15.5px] font-bold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50"
        >
          {submitting ? "Adding you…" : `Notify me about ${requestedRegion}`}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="w-full sm:w-auto sm:min-w-[260px] inline-flex items-center justify-center gap-3 min-h-[48px] px-6 py-3 text-[15px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm disabled:opacity-60"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
              fill="#EA4335"
            />
          </svg>
          {submitting ? "Redirecting…" : "Continue with Google"}
        </button>
      )}

      <p className="mt-4 text-[12px] text-gray-400">
        No spam, no password. Unsubscribe any time.
      </p>

      <ShareSection region={requestedRegion} userEmail={user?.email ?? null} />
    </div>
  );
}

interface ShareSectionProps {
  region: string;
  userEmail: string | null;
}

function ShareSection({ region, userEmail }: ShareSectionProps) {
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!userEmail) {
      setUserReferralCode(null);
      return;
    }
    let cancelled = false;
    getOrCreateReferralCode(userEmail)
      .then((code) => {
        if (!cancelled) setUserReferralCode(code);
      })
      .catch(() => {
        if (!cancelled) setUserReferralCode(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  useEffect(() => {
    if (!region) {
      setVoteCount(0);
      return;
    }
    let cancelled = false;
    getRegionVoteCount(region)
      .then((count) => {
        if (!cancelled) setVoteCount(count);
      })
      .catch(() => {
        if (!cancelled) setVoteCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [region]);

  const shareUrl = userReferralCode
    ? buildReferralLink(userReferralCode, "/request-region")
    : "https://nextvoters.com/request-region";
  const shareMessage = `Help bring Next Voters to ${region} — add your name: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (older iOS or insecure origin); input is
      // readable and user can long-press to copy.
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        Help get {region} launched
      </p>
      <p className="text-[13px] text-gray-500 mb-4">
        We prioritize regions with the most interest. Share with neighbors who&rsquo;d use Next Voters.
      </p>

      {voteCount >= 2 && (
        <div className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-full bg-brand/10 text-brand text-[12px] font-semibold">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {voteCount} people have already asked
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-stretch gap-2.5 max-w-[420px] mb-4">
        <div className="flex-1 min-w-[200px] flex items-stretch border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-center px-3 border-r border-gray-200 bg-gray-50">
            <Link2 className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            className="flex-1 min-w-0 px-3 py-2.5 text-[13px] text-gray-600 bg-transparent focus:outline-none"
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Share link"
          />
        </div>
        <button
          type="button"
          onClick={handleCopyLink}
          className="px-4 py-2.5 text-[13px] font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
        >
          {linkCopied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on X about ${region}`}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on Facebook about ${region}`}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on WhatsApp about ${region}`}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </a>
        <a
          href={smsUrl}
          aria-label={`Share ${region} via text message`}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>

      <p className="mt-4 text-[12px] text-gray-400">
        Every ask moves {region} up our priority list.
      </p>
    </div>
  );
}
