"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ContactSubject, CONTACT_SUBJECT_OPTIONS, PUBLIC_SUPPORT_EMAIL, contactSubjectLabel } from "@/lib/contact-shared";
import { trackEvent, trackEventOnce } from "@/lib/analytics";

type FormState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [feedbackMessage, setFeedbackMessage] = React.useState("");
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });

  React.useEffect(() => {
    trackEventOnce("contact_form_viewed", {}, { key: "contact-form-viewed" });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage("");
    setFormState("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Message could not be sent.");
      }

      setFormState("success");
      setFeedbackMessage(
        `Message received. We will get back to you via email regarding ${contactSubjectLabel((formData.subject || "other") as ContactSubject)}.`,
      );
      setFormData({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (error) {
      setFormState("error");
      const message = error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.";
      setFeedbackMessage(message);
      trackEvent("contact_form_failed", { reason: message });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (formState !== "loading" && formState !== "idle") {
      setFormState("idle");
      setFeedbackMessage("");
    }
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Contact Info */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">İletişim Bilgileri</h3>
          <p className="mt-2 text-muted-foreground">
            Have questions? Contact us and we'll help you as soon as possible.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">E-posta</h4>
              <p className="mt-1 text-sm text-muted-foreground">{PUBLIC_SUPPORT_EMAIL}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Yanıt süresi</h4>
              <p className="mt-1 text-sm text-muted-foreground">Most messages are answered within the same business day</p>
            </div>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h4 className="mb-2 font-semibold text-foreground">Hızlı notlar</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Keep the subject clear</li>
              <li>• Select the correct billing / access / technical support</li>
              <li>• Include the book slug or preview link</li>
              <li>• Gerekirse ekran görüntüsü paylaşın</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="border-border/80">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Adınız Soyadınız"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  E-posta *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Select a subject</option>
                {CONTACT_SUBJECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                minLength={10}
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="Write your message here..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-xl"
              disabled={formState === "loading"}
            >
              {formState === "loading" && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              )}
              {formState === "success" && (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Gönderildi!
                </>
              )}
              {formState === "idle" && (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>

            <p className="text-xs leading-6 text-muted-foreground">
              A copy of your message will be sent to your email. You can share additional context with the support team if needed.
            </p>

            {formState === "success" && feedbackMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">{feedbackMessage}</span>
              </motion.div>
            ) : null}

            {formState === "error" && feedbackMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{feedbackMessage}</span>
              </motion.div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}