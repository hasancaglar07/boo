import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Privacy Policy | Data Usage",
  description:
    "Comprehensive privacy policy for Book Generator. Learn how we collect, use, store, and protect your personal information, content data, and payment information.",
  path: "/privacy",
  keywords: ["privacy policy", "book generator data usage", "ai content security", "data protection"],
});

const sections = [
  {
    number: "1",
    title: "Information We Collect",
    content:
      "We collect information you provide directly, information generated through use of the service, and information from third-party authentication providers.",
    subsections: [
      {
        title: "1.1 Account Data",
        text: "When you create an account, we collect your name, email address, and authentication credentials. If you sign in through a third-party provider (Google, GitHub), we receive the profile information you authorize.",
      },
      {
        title: "1.2 Content Data",
        text: "Book briefs, chapter content, titles, outlines, metadata, cover designs, and exported files (EPUB, PDF) you create or generate through the platform are stored as part of your book production workflow.",
      },
      {
        title: "1.3 Usage Data",
        text: "We collect information about how you interact with the service, including pages visited, features used, time spent in sessions, funnel progress, and device/browser information for analytics and service improvement.",
      },
      {
        title: "1.4 Payment Data",
        text: "When you make a purchase, payment card information is processed directly by Stripe. We do not store your full credit card number on our servers. We retain records of transactions, plan selections, and billing history.",
      },
    ],
  },
  {
    number: "2",
    title: "How We Use Your Information",
    content:
      "We use the information we collect to provide, maintain, and improve the Book Generator service, process transactions, and communicate with you.",
    subsections: [
      {
        title: "2.1 Service Delivery",
        text: "Your account data is used to authenticate you, manage your subscription, save your books, and provide customer support.",
      },
      {
        title: "2.2 Content Generation",
        text: "Your book briefs, topic descriptions, and preferences are used to generate book content, outlines, covers, and export files through AI providers.",
      },
      {
        title: "2.3 Communication",
        text: "We may send you service-related emails (receipts, plan updates, security alerts) and, with your consent, marketing communications. You can unsubscribe from marketing emails at any time.",
      },
      {
        title: "2.4 Analytics & Improvement",
        text: "Usage data helps us understand how the service is used, identify issues, and improve the product experience. We use Google Analytics with cookie consent to collect anonymized usage patterns.",
      },
    ],
  },
  {
    number: "3",
    title: "AI-Generated Content & Data Processing",
    content:
      "Book Generator uses third-party AI providers to generate book content based on your inputs.",
    subsections: [
      {
        title: "3.1 AI Processing",
        text: "Your topic descriptions, outlines, and preferences are sent to AI providers for content generation. These providers process data according to their own privacy policies and data processing agreements.",
      },
      {
        title: "3.2 Content Ownership",
        text: "You retain ownership of the content you generate. AI providers do not use your Book Generator inputs to train their models unless you separately consent through their own services.",
      },
      {
        title: "3.3 Output Quality",
        text: "AI-generated content may contain inaccuracies. You are responsible for reviewing, editing, and verifying all generated content before publication or distribution.",
      },
    ],
  },
  {
    number: "4",
    title: "Payment Processing",
    content:
      "We use Stripe, Inc. as our payment service provider. When you make a payment, your card data is transmitted directly to Stripe and is subject to Stripe's privacy policy and security standards. Book Generator does not store full credit card numbers, CVV codes, or magnetic stripe data. We retain transaction records, billing history, and the last four digits of your card for receipt and support purposes.",
  },
  {
    number: "5",
    title: "Cookies & Analytics",
    content:
      "We use cookies and similar tracking technologies for the following purposes:",
    subsections: [
      {
        title: "5.1 Essential Cookies",
        text: "Required for the service to function properly, including authentication sessions, CSRF protection, and load balancing.",
      },
      {
        title: "5.2 Analytics Cookies",
        text: "We use Google Analytics to collect anonymized data about site usage. Analytics cookies are only activated after you provide consent through our cookie consent banner. You can withdraw consent at any time.",
      },
      {
        title: "5.3 Managing Cookies",
        text: "You can manage your cookie preferences through our cookie consent tool or by configuring your browser settings. Disabling essential cookies may affect the functionality of the service.",
      },
    ],
  },
  {
    number: "6",
    title: "Third-Party Services",
    content:
      "Book Generator integrates with the following categories of third-party services that may process your data according to their own policies:",
    subsections: [
      {
        title: "6.1 AI Content Providers",
        text: "Services that generate book content, outlines, and cover designs based on your inputs. Your topic data and preferences are shared with these providers for content generation purposes.",
      },
      {
        title: "6.2 Payment Processor",
        text: "Stripe processes payment transactions. See Stripe's privacy policy for details on how they handle payment data.",
      },
      {
        title: "6.3 Authentication Providers",
        text: "Google and GitHub may share basic profile information when you use their sign-in services, subject to their respective privacy policies.",
      },
      {
        title: "6.4 Analytics Provider",
        text: "Google Analytics collects anonymized usage data. Data is processed according to Google's privacy policy and data retention settings.",
      },
    ],
  },
  {
    number: "7",
    title: "Data Storage & Security",
    content:
      "Your data is stored on secure servers with appropriate technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction. We implement encryption in transit (TLS) and at rest, access controls, regular security assessments, and monitoring systems. While we strive to protect your data, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    number: "8",
    title: "Data Retention",
    content:
      "We retain your account data for as long as your account is active. Content data (books, chapters, exports) is retained until you delete it or close your account. Usage and analytics data is retained for up to 26 months. Billing and transaction records are retained for the period required by applicable tax and financial regulations (typically 5–7 years). Upon account deletion, we remove personal data within 30 days, except where retention is required by law.",
  },
  {
    number: "9",
    title: "Your Rights",
    content:
      "Depending on your jurisdiction, you may have the following rights regarding your personal data:",
    subsections: [
      {
        title: "9.1 Access & Portability",
        text: "You can request a copy of your personal data and, where technically feasible, receive it in a structured, commonly used format.",
      },
      {
        title: "9.2 Correction",
        text: "You can update or correct your account information at any time through your account settings.",
      },
      {
        title: "9.3 Deletion",
        text: "You can request deletion of your personal data by contacting us or deleting your account. Certain data may be retained as required by law.",
      },
      {
        title: "9.4 Objection & Restriction",
        text: "You may object to or request restriction of certain data processing activities, including direct marketing.",
      },
    ],
  },
  {
    number: "10",
    title: "Children's Privacy",
    content:
      "Book Generator is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will take steps to delete such information promptly. If you believe a child under 13 has provided us with personal data, please contact us immediately.",
  },
  {
    number: "11",
    title: "International Users",
    content:
      "Book Generator is operated from the United States and may be accessed from other countries. If you are accessing the service from outside the US, please be aware that your data may be transferred to, stored, and processed in the United States or other countries where our service providers operate. By using Book Generator, you consent to the transfer of your data to these jurisdictions.",
  },
  {
    number: "12",
    title: "Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a new \"Last updated\" date and, for significant changes, by sending a notification to your registered email address. Continued use of the service after changes take effect constitutes acceptance of the updated policy.",
  },
  {
    number: "13",
    title: "Contact Information",
    content:
      "If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us through our contact page or email our support team. We will respond to privacy-related inquiries within 30 days.",
  },
];

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>Privacy</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 3, 2026</p>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          This Privacy Policy describes how Book Generator (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, stores, and protects your personal information when you use our AI-powered book generation platform. We are committed to transparency and data minimization in all our data practices.
        </p>
        <div className="mt-12 space-y-6">
          {sections.map((section) => (
            <Card key={section.number}>
              <CardContent className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {section.number}. {section.title}
                </h2>
                <p className="text-sm leading-7 text-muted-foreground">{section.content}</p>
                {"subsections" in section && section.subsections && (
                  <div className="ml-4 space-y-3 border-l-2 border-border/60 pl-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.title}>
                        <h3 className="text-sm font-medium text-foreground">{sub.title}</h3>
                        <p className="mt-1 text-sm leading-7 text-muted-foreground">{sub.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 rounded-[20px] border border-border/80 bg-accent/20 p-6">
          <p className="text-sm leading-7 text-muted-foreground">
            For questions about this policy or your personal data, visit our{" "}
            <a href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
              contact page
            </a>{" "}
            or email our support team.
          </p>
        </div>
      </section>
    </MarketingPage>
  );
}
