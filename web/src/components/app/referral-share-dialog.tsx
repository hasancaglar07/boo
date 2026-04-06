"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

const DIALOG_SHOWN_KEY = "referral_dialog_shown";

interface ReferralShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReferralData {
  code: string;
  clicks: number;
  referralUrl: string;
}

export function ReferralShareDialog({ open, onOpenChange }: ReferralShareDialogProps) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    trackEvent("referral_share_dialog_shown", {});
    localStorage.setItem(DIALOG_SHOWN_KEY, "1");

    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData({ code: json.code, clicks: json.clicks, referralUrl: json.referralUrl });
      })
      .catch(() => null);
  }, [open]);

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).catch(() => null);
    setCopied(true);
    trackEvent("referral_link_copied", {});
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    if (!data) return;
    trackEvent("referral_whatsapp_clicked", {});
    const text = `Write professional books in minutes with BookGenerator.net! I'm inviting you — when you sign up, you help me earn a 30% commission 😊 ${data.referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTwitter() {
    if (!data) return;
    trackEvent("referral_twitter_clicked", {});
    const text = `I wrote a book in minutes with AI 🚀 Try BookGenerator.net, if you sign up with my link, everyone wins:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl)}`,
      "_blank",
    );
  }

  function handleDismiss() {
    trackEvent("referral_share_dialog_dismissed", {});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} panelClassName="max-w-[min(480px,calc(100vw-24px))]">
      <DialogContent className="rounded-[24px] border-border/60 bg-card p-6">
        <DialogHeader>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground w-fit">
            <Share2 className="size-3.5" />
            Invite Your Friends
          </div>
          <DialogTitle>Share Your Affiliate Link, Earn 30% Commission!</DialogTitle>
          <DialogDescription>
            When your friends sign up through your link and make a payment, you earn 30% commission from each payment. They must use your link to sign up.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-[14px] border border-border/60 bg-muted/40 px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
              {data ? data.referralUrl : "Loading..."}
            </span>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!data}>
              {copied ? (
                <>
                  <Check className="mr-1 size-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-3.5" />
                  Kopyala
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleWhatsApp} disabled={!data}>
              WhatsApp
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleTwitter} disabled={!data}>
              X (Twitter)
            </Button>
          </div>

          {data && data.clicks > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {data.clicks} people clicked your referral link
            </p>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Returns true if the dialog has already been shown to this user (localStorage check) */
export function hasReferralDialogBeenShown(): boolean {
  try {
    return localStorage.getItem(DIALOG_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}
