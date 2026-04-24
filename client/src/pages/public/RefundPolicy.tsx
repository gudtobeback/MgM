import React, { useState } from "react";

import AlertCard from "@/src/components/ui/AlertCard";
import SideBar from "@/src/components/public_pages/SideBar";
import InfoCard from "@/src/components/public_pages/InfoCard";
import HeroSection from "@/src/components/public_pages/HeroSection";
import CheckPoints from "@/src/components/public_pages/CheckPoints";

const sections = [
  {
    id: "migration",
    label: "Migration Services (One-Time)",
    short: "Migration",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <div className="space-y-3">
          {[
            {
              title: "Refund Eligibility Before Execution -",
              desc: "Customers are eligible for a full refund if payment has been completed and the migration process has not yet been initiated.",
            },
            {
              title: "No Refund After Execution -",
              desc: "Once a migration process has been initiated or completed, the service is considered fully delivered and consumed, and no refunds will be issued.",
            },
            {
              title:
                "Failed or Incomplete Migration (Platform Responsibility) -",
              desc: "If a migration fails due to a platform-side issue and cannot be completed after reasonable attempts, we may re-run the migration at no cost or issue a partial or full refund at our discretion.",
            },
            {
              title: "Customer-Side Issues -",
              desc: "Refunds will not be issued for failures caused by incorrect configurations, insufficient permissions, third-party limitations, or external infrastructure issues.",
            },
          ].map((item) => (
            <InfoCard key={item?.title} title={item?.title} desc={item?.desc} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "subscription",
    label: "Backup / Protection Plan (Subscription)",
    short: "Subscription",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <div className="space-y-3">
          {[
            {
              title: "Free Trial -",
              desc: "We offer a limited free trial period. No charges are applied during the trial, and customers may cancel before it ends.",
            },
            {
              title: "Subscription Charges -",
              desc: "After the trial, subscription fees are billed on a recurring basis and are non-refundable once the billing cycle begins.",
            },
            {
              title: "Cancellation Policy -",
              desc: "Customers may cancel anytime. Protection remains active until the end of the billing cycle, and no partial refunds are issued.",
            },
          ].map((item) => (
            <InfoCard key={item?.title} title={item?.title} desc={item?.desc} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "partner",
    label: "Partner Transactions",
    short: "Partner",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          For services purchased through authorized partners, pricing and
          refunds are governed by partner agreements. Refund requests must be
          directed through the partner.
        </p>
      </div>
    ),
  },
  {
    id: "abuse",
    label: "Abuse & Misuse Protection",
    short: "Abuse & Misuse",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          We reserve the right to deny refund requests in cases of misuse,
          repeated cancellation patterns, or attempts to exploit the platform.
        </p>

        <p className="font-semibold text-[#003E68] uppercase">
          Examples of behaviour that may result in a denied refund request:
        </p>

        <ul className="space-y-3">
          {[
            "Misuse or abuse of platform features or services",
            "Repeated cancellation and re-subscription patterns",
            "Attempts to exploit the platform or circumvent billing",
            "Providing false or misleading information in a refund request",
          ].map((point) => (
            <CheckPoints key={point} point={point} />
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "dispute",
    label: "Dispute Resolution",
    short: "Disputes",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          If you believe you are eligible for a refund, contact our support team
          with all relevant details. Requests will be reviewed within a
          reasonable timeframe and you will be notified of the outcome.
        </p>

        <InfoCard
          title="Contact Support -"
          desc={
            <p>
              Reach out to us at{" "}
              <a
                href="mailto:support@aurionone.com"
                className="text-[#D7FB71] hover:underline"
              >
                support@aurionone.com
              </a>{" "}
              with your order details, the reason for your request, and any
              supporting documentation.
            </p>
          }
        />
      </div>
    ),
  },
  {
    id: "updates",
    label: "Policy Updates",
    short: "Updates",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          We reserve the right to update this Refund Policy at any time. Changes
          will be reflected on this page with an updated revision date. We
          encourage you to review this policy periodically to stay informed of
          any modifications.
        </p>

        <InfoCard
          title="Important -"
          desc="Continued use of our services following any update to this Refund Policy constitutes your acceptance of the revised terms."
        />
      </div>
    ),
  },
];

export default function RefundPolicy() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <HeroSection
        title="Refund Policy"
        desc="At AurionOne, we believe in transparent and fair billing. Here's everything you need to know about our refund and cancellation terms."
      />

      <div className="flex gap-16 mx-5 lg:mx-20">
        {/* Sidebar navigation */}
        <SideBar
          sections={sections}
          activeSection={activeSection}
          scrollTo={scrollTo}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile nav pills */}
          <div className="flex flex-wrap gap-2 mb-6 lg:hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-all"
              >
                {s.short}
              </button>
            ))}
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-12">
            <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
              <p className="font-semibold">Last Updated: April 24, 2026</p>

              <p>
                At AurionOne, we provide automated infrastructure migration and
                protection services designed to deliver immediate operational
                value.
              </p>

              <p>
                Due to the nature of these services — particularly the execution
                of one-time migration processes — our refund policy is
                structured to ensure fairness while protecting against misuse.
              </p>
            </div>

            {sections.map((section, idx) => (
              <div
                key={section.id}
                id={section.id}
                className="flex flex-col gap-5 scroll-mt-9"
              >
                <p className="font-bold text-md text-[#015C95]">
                  {idx + 1}. {section.label}
                </p>

                <div className="px-2">{section.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <AlertCard variant="blue">
              Refund eligibility depends on the stage of service delivery. Once
              a migration or billing cycle has been initiated, refunds are
              generally not applicable. Contact support for any clarifications.
            </AlertCard>
          </div>
        </div>
      </div>
    </div>
  );
}
