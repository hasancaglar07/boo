import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Terms of Use | Service Terms",
  description:
    "Terms of service for Book Generator. Review the complete service agreement including subscription terms, payment policies, content ownership, AI disclaimers, and user responsibilities.",
  path: "/terms",
  keywords: ["terms of service", "book generator terms", "service agreement", "subscription terms"],
});

const sections = [
  {
    number: "1",
    title: "Acceptance of Terms",
    content:
      'By accessing or using Book Generator (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.',
  },
  {
    number: "2",
    title: "Description of Service",
    content:
      'Book Generator is an AI-powered book production platform that allows users to create, edit, and export book content. The Service includes AI-assisted outline generation, chapter writing, cover design, and export capabilities in EPUB and PDF formats. The Service is provided by Book Generator ("we," "our," or "us").',
  },
  {
    number: "3",
    title: "Account Registration & Security",
    content:
      "To access certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration and keep your account information updated. You must notify us immediately of any unauthorized use of your account. We are not liable for losses caused by unauthorized access to your account.",
  },
  {
    number: "4",
    title: "Subscription Plans & Pricing",
    content:
      "The Service offers the following plan tiers:",
    subsections: [
      {
        title: "4.1 Plan Tiers",
        text: "Single Book ($4 one-time): Access to one complete book production with draft, cover, and EPUB/PDF export. Starter ($19/month): Up to 10 books per month with 20 covers and full export options. Creator ($39/month): Up to 30 books per month with research tools, KDP analysis, and additional export formats. Studio ($79/month): Up to 80 books per month with API access, automation, and high-volume production features.",
      },
      {
        title: "4.2 Plan Limits",
        text: "Monthly book credits are allocated per billing cycle and do not roll over to subsequent months. Plan features and limits are subject to change with 30 days' notice.",
      },
      {
        title: "4.3 Plan Changes",
        text: "You may upgrade, downgrade, or cancel your subscription at any time through your billing settings. Upgrades take effect immediately. Downgrades take effect at the end of the current billing cycle. No prorated refunds for partial months.",
      },
    ],
  },
  {
    number: "5",
    title: "Payment Terms",
    content:
      "By subscribing to a paid plan or making a one-time purchase, you agree to the following payment terms:",
    subsections: [
      {
        title: "5.1 Payment Processing",
        text: "All payments are processed by Stripe, Inc. We do not store full credit card numbers on our servers. By providing your payment information, you authorize Stripe to charge the applicable fees.",
      },
      {
        title: "5.2 Billing Cycle",
        text: "Monthly subscriptions are billed in advance on the same date each month. One-time purchases are billed at the time of transaction. Applicable taxes may be added based on your jurisdiction.",
      },
      {
        title: "5.3 Auto-Renewal",
        text: "Monthly subscriptions auto-renew at the end of each billing cycle unless you cancel before the renewal date. You will be charged the then-current rate for your plan.",
      },
    ],
  },
  {
    number: "6",
    title: "Refund Policy",
    content:
      "We offer a 30-day money-back guarantee on all plans. If you are not satisfied with the Service, you may request a full refund within 30 days of your initial purchase by contacting our support team. Refunds are processed to the original payment method within 5–10 business days. This refund policy does not apply to accounts that have been suspended or terminated due to violations of these Terms.",
  },
  {
    number: "7",
    title: "Intellectual Property Rights",
    content:
      "The following terms govern the intellectual property rights of both parties:",
    subsections: [
      {
        title: "7.1 Your Content",
        text: "You retain all ownership rights to the content you create using the Service, including book briefs, chapter content, titles, outlines, and exported files. By using the Service, you grant us a limited, non-exclusive license to process your content for the purpose of providing the Service.",
      },
      {
        title: "7.2 Platform Intellectual Property",
        text: 'The Service, including its original content, features, functionality, software, and design, is owned by Book Generator and protected by international copyright, trademark, and other intellectual property laws. The "Book Generator" name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Book Generator.',
      },
      {
        title: "7.3 AI-Generated Content",
        text: "Content generated by AI through the Service is owned by you. You are responsible for ensuring that AI-generated content does not infringe on third-party intellectual property rights. We make no warranties regarding the originality or non-infringement of AI-generated content.",
      },
    ],
  },
  {
    number: "8",
    title: "AI-Generated Content Disclaimer",
    content:
      "The Service uses artificial intelligence to assist in book content generation. AI-generated content may contain inaccuracies, errors, or biased language. You are solely responsible for reviewing, editing, and verifying all AI-generated content before publication, distribution, or commercial use. We do not guarantee that AI-generated content will meet any specific quality, accuracy, or publishing standard. You should not rely solely on AI-generated content for factual claims, legal advice, medical information, or other specialized content.",
  },
  {
    number: "9",
    title: "User Responsibilities & Acceptable Use",
    content:
      "You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:",
    subsections: [
      {
        title: "9.1 Prohibited Activities",
        text: "Use the Service to generate content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable. Generate content that infringes on third-party intellectual property rights. Attempt to reverse-engineer, decompile, or disassemble the Service. Use automated systems or bots to access the Service beyond authorized API usage. Share your account credentials with third parties or resell access to the Service without authorization.",
      },
      {
        title: "9.2 Content Responsibility",
        text: "You are solely responsible for the content you generate, publish, and distribute. We are not liable for any claims, damages, or losses arising from your use of AI-generated content.",
      },
    ],
  },
  {
    number: "10",
    title: "Service Availability & Modifications",
    content:
      "We strive to provide continuous, uninterrupted service but cannot guarantee the Service will be available at all times. We reserve the right to modify, suspend, or discontinue any part of the Service with reasonable notice. We may release updates, new features, or modifications to the Service at any time. Planned maintenance windows will be communicated in advance when possible.",
  },
  {
    number: "11",
    title: "Termination",
    content:
      "The following terms govern the termination of accounts and access:",
    subsections: [
      {
        title: "11.1 Termination by You",
        text: "You may terminate your account at any time by canceling your subscription and deleting your account through your account settings. Upon termination, your right to use the Service will cease immediately.",
      },
      {
        title: "11.2 Termination by Us",
        text: "We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or for any other reason at our discretion. We will provide notice where possible, except in cases of urgent security concerns.",
      },
      {
        title: "11.3 Effect of Termination",
        text: "Upon termination, your content may be deleted within 30 days. We are not obligated to retain or provide copies of your content after account termination. Sections relating to intellectual property, liability, and dispute resolution survive termination.",
      },
    ],
  },
  {
    number: "12",
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by law, Book Generator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of or inability to use the Service. Our total liability for any claims arising from these Terms or the Service shall not exceed the amount you paid us in the 12 months preceding the claim.",
  },
  {
    number: "13",
    title: "Indemnification",
    content:
      "You agree to indemnify, defend, and hold harmless Book Generator, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of another party.",
  },
  {
    number: "14",
    title: "Dispute Resolution",
    content:
      "Any disputes arising from these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with applicable rules. You agree to resolve disputes with us on an individual basis and waive any right to participate in class action lawsuits or class-wide arbitration.",
  },
  {
    number: "15",
    title: "Governing Law",
    content:
      "These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any legal proceedings not subject to arbitration shall be brought in the courts of competent jurisdiction.",
  },
  {
    number: "16",
    title: "Changes to Terms",
    content:
      "We reserve the right to modify these Terms at any time. Material changes will be communicated via email to your registered address and by updating the \"Last updated\" date on this page. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms. If you disagree with the changes, you must stop using the Service and may request a refund within 30 days of the change notice.",
  },
  {
    number: "17",
    title: "Contact Information",
    content:
      "For questions about these Terms, please visit our contact page or email our support team. For billing-specific inquiries, please use the billing contact information provided in your account settings.",
  },
];

export default function TermsPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>Terms</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
          <span>Last updated: April 3, 2026</span>
          <span>·</span>
          <span>Effective date: April 3, 2026</span>
        </div>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          These Terms of Service govern your use of Book Generator, our AI-powered book production platform. By accessing or using the Service, you agree to be bound by these Terms. Please read them carefully before using the Service.
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
            For questions about these Terms, visit our{" "}
            <a href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
              contact page
            </a>{" "}
            or email our support team. For privacy-related questions, see our{" "}
            <a href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </MarketingPage>
  );
}
