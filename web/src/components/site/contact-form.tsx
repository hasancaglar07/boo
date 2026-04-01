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

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FormState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setFormState("success");
    
    // Reset after 3 seconds
    setTimeout(() => {
      setFormState("idle");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
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
            Sorularınız mı var? Bizimle iletişime geçin, en kısa sürede size yardımcı olalım.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">E-posta</h4>
              <p className="mt-1 text-sm text-muted-foreground">support@bookgenerator.com</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Response Time</h4>
              <p className="mt-1 text-sm text-muted-foreground">Genelde 2 saat içinde yanıt</p>
            </div>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h4 className="font-semibold text-foreground mb-2">💡 Hızlı İpuçları</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Konu başlığı net olsun</li>
              <li>• Kitap slug'ını ekleyin</li>
              <li>• Ekran görüntüsü paylaşın</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="border-border/80">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                  className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Konu *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Konu seçin</option>
                <option value="technical">Teknik Sorun</option>
                <option value="billing">Faturalama</option>
                <option value="account">Hesap Erişimi</option>
                <option value="content">İçerik Üretimi</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Mesaj *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="Mesajınızı buraya yazın..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-xl"
              disabled={formState === "loading" || formState === "success"}
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
                  Mesaj Gönder
                </>
              )}
            </Button>

            {formState === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Bir hata oluştu. Lütfen tekrar deneyin.</span>
              </motion.div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
