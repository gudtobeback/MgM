import React, { useState } from "react";

import AlertCard from "@/src/components/ui/AlertCard";
import SideBar from "@/src/components/public_pages/SideBar";
import InfoCard from "@/src/components/public_pages/InfoCard";
import HeroSection from "@/src/components/public_pages/HeroSection";
import CheckPoints from "@/src/components/public_pages/CheckPoints";

const sections = [
  {
    id: "collection",
    label: "Information We Collect",
    short: "Info We Collect",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          We collect Personal Information through the Website, which includes
          any information that relates to a User and is capable of identifying
          such User, either directly or indirectly.
        </p>

        <div className="space-y-3">
          {[
            {
              title: "Contact Information -",
              desc: "Full name, company name, designation, business email address, registered office address, and phone number.",
            },
            {
              title: "User Details -",
              desc: "Age, sex, date of birth, nationality, government identification documents, social media account details, and other similar details.",
            },
            {
              title: "Financial Information -",
              desc: "Payment instrument information, transaction details, transaction history, preferences, method, mode and manner of payment, spending patterns or trends, and other similar information.",
            },
            {
              title: "Technical Information -",
              desc: "IP addresses, access and server logs, website usage data, device identifiers, real-time geographic location (if permitted), and details of services availed.",
            },
          ].map((item) => (
            <InfoCard key={item?.title} title={item?.title} desc={item?.desc} />
          ))}
        </div>

        <p>
          The Website may request permissions such as sending messages and
          accessing real-time location. You may decline, though this may limit
          our ability to provide Services. Where possible, we indicate which
          fields are mandatory and which are optional.
        </p>

        <p>
          We may automatically track certain information about your activity on
          the Website for internal research on demographics, interests, and
          behaviour — compiled and analysed on an aggregated basis. We may also
          occasionally ask you to complete optional online surveys to tailor
          your experience and display content according to your preferences.
        </p>

        <p>
          We use <strong>cookies</strong> on certain pages to analyse web page
          flow, measure promotional effectiveness, and promote trust and safety.
          Most cookies are session cookies deleted at the end of a session. You
          may decline cookies via your browser, though some features may be
          unavailable. We place both permanent and temporary cookies; none
          contain personally identifiable information.
        </p>

        <InfoCard
          title="Children under 18 -"
          desc={
            <p>
              We do not knowingly solicit data from or market to children under
              18. If you become aware of any such data collected, please contact
              us at{" "}
              <a
                href="mailto:privacy@aurionone.com"
                className="text-[#D7FB71] hover:underline"
              >
                privacy@aurionone.com
              </a>
              . We will deactivate the account and promptly delete such data.
            </p>
          }
        />
      </div>
    ),
  },
  {
    id: "use",
    label: "How We Use Your Information",
    short: "How We Use It",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p className="font-semibold text-[#003E68] uppercase">
          We use Personal Information for the following purposes:
        </p>

        <ul className="space-y-3">
          {[
            "To carry out obligations arising from your use of the Website or Services",
            "To provide the Services and communicate with you about them",
            "To obtain feedback on the Services obtained",
            "To process and analyse data through authorised third parties",
            "To enable subsidiaries or affiliates to offer their services",
            "To post testimonials and provide personalised offers and recommendations",
            "To contact you across multiple devices in relation to services or features",
            "To operate, evaluate and improve the Company's business and Website",
            "To generate aggregated insights and track user behaviour and trends",
            "To run personalised marketing and promotional campaigns",
            "To respond to requests, feedback, claims, or disputes",
            "To provide location-based services and personalised content",
            "To protect against fraud, illegal activity, and financial loss",
            "To statistically analyse trends and service usage",
            "To conduct audits and quality assessments",
            "To comply with applicable laws and legal obligations",
          ].map((point) => (
            <CheckPoints point={point} />
          ))}
        </ul>

        <InfoCard desc="Where we use your information for marketing purposes, we will provide you the ability to opt-out of such communications at any time." />
      </div>
    ),
  },
  {
    id: "sharing",
    label: "Sharing with Third Parties",
    short: "Third Parties",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          We share your Personal Information with third parties under
          appropriate written data protection obligations, including:
        </p>

        <div className="space-y-3">
          {[
            {
              title: "Group Entities -",
              desc: "Subsidiaries, affiliates, or group entities to offer their products and services through the Website.",
            },
            {
              title: "Service Providers -",
              desc: "For storing, analysing, delivering products, security, customer service, marketing studies, profiling, user analysis, and payment processing.",
            },
            {
              title: "Government Authorities -",
              desc: "When required by applicable law or legal process.",
            },
            {
              title: "Third-Party Advertisers -",
              desc: "Advertising companies may use cookie and tracking data to serve relevant ads when you visit the Website.",
            },
            {
              title: "Other Third Parties -",
              desc: "To enforce Terms of Use, protect against fraud, for risk management, advisory or dispute resolution, or where necessary to protect vital interests.",
            },
          ].map((item) => (
            <InfoCard key={item?.title} title={item?.title} desc={item?.desc} />
          ))}
        </div>

        <p>
          We may transfer Personal Information in connection with a merger,
          acquisition, reorganisation, or restructuring of the business. We also
          use third-party online payment gateways; information shared during
          transactions is accessible to those operators, including your online
          purchase history.
        </p>
      </div>
    ),
  },
  {
    id: "protection",
    label: "Data Protection",
    short: "Data Protection",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          The Website has adequate security measures in place to protect against
          loss, misuse, and alteration. Once your information is in our
          possession, we adhere to security guidelines protecting it against
          unauthorised access. However, no Website can fully eliminate security
          risks.
        </p>

        <p>
          If you suspect any unauthorised use of your account, notify us
          immediately at{" "}
          <a
            href="mailto:privacy@aurionone.com"
            className="text-indigo-600 hover:underline"
          >
            privacy@aurionone.com
          </a>
          . All Personal Information collected is hosted on servers located in
          India.
        </p>

        <p>
          We retain Personal Information for as long as necessary to provide
          Services, comply with legal obligations, resolve disputes, and enforce
          agreements. Even after deletion, data may exist on backup or archival
          media for legal, tax, or regulatory purposes.
        </p>

        <InfoCard
          title="Important :"
          desc="We are not responsible for breaches caused by third-party actions or Force Majeure Events — including acts of government, hacking, natural disasters, civil unrest, computer crashes, breach of security and encryption, or poor internet service."
        />
      </div>
    ),
  },
  {
    id: "rights",
    label: "Your Rights",
    short: "Your Rights",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p className="font-semibold text-[#003E68] uppercase">
          You have the following rights with respect to your Personal
          Information:
        </p>

        <ul className="space-y-3">
          {[
            "Access, review, and modify your information by logging into your account",
            "Withdraw consent by writing to us at privacy@aurionone.com",
            "Opt-out of promotional mailers via the unsubscribe link in any email",
            "Opt-out of non-essential marketing communications after account setup",
          ].map((right) => (
            <CheckPoints point={right} />
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "general",
    label: "General Terms",
    short: "General Terms",
    content: (
      <div className="space-y-5 text-sm text-[#41474F] leading-relaxed">
        <p>
          The Website may include hyperlinks to external websites ("Third Party
          Links"). We have no control over such links and are not liable for any
          loss or damage arising from disclosure of Personal Information via
          those links. We are not responsible for any breach of security by any
          third party that receives your Personal Information.
        </p>

        <p>
          Personal data shall be retained only for as long as necessary to
          fulfil the purposes for which it was collected or as required by law.
          Upon fulfilment of those purposes or withdrawal of consent, data shall
          be deleted or rendered inaccessible, unless retention is required by
          law.
        </p>

        <p>
          The Company shall not be held responsible for any loss, damage, or
          misuse attributable to a Force Majeure Event — including sabotage,
          fire, flood, explosion, acts of God, civil commotion, strikes, riots,
          war, acts of government, computer hacking, or any similar event beyond
          our control.
        </p>

        <p>
          If any provision of this Privacy Policy is found invalid or
          unenforceable, it will be deemed deleted and the remaining provisions
          will remain in full effect.
        </p>

        <p className="font-semibold text-[#003E68] uppercase">
          Data Protection / Grievance Officer :
        </p>

        <InfoCard
          title="In accordance with the Information Technology Act 2000, the Digital Personal Data Protection Act 2023, and the Digital Personal Data Protection Rules 2025:"
          desc={
            <>
              <p>
                <span className="font-medium">Name:</span> Chetan Anchan
              </p>

              <p>
                <span className="font-medium">Email:</span>{" "}
                <a
                  href="mailto:Chetan@dealmytime.com"
                  className="text-[#D7FB71] hover:underline"
                >
                  Chetan@dealmytime.com
                </a>
              </p>

              <p>
                <span className="font-medium">Address:</span> Unit 115,
                InspireHub, JP Road, 4 Bunglows, Opp Gurudwara, DN Nagar,
                Andheri West – 400058
              </p>
            </>
          }
        />

        {/* Contact */}
        <InfoCard
          title="Contact Us -"
          desc={
            <p>
              For any questions or comments regarding this Privacy Policy,
              please write to us at{" "}
              <a
                href="mailto:privacy@aurionone.com"
                className="text-[#D7FB71] hover:underline"
              >
                privacy@aurionone.com
              </a>
              .
            </p>
          }
        />
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
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
        title="Privacy Policy"
        desc="At AurionOne, we architect our infrastructure with security and your privacy as our foundational principles. Here is how we protect your data."
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
              <p className="font-semibold">Last Updated: March 30, 2026</p>

              <p>
                Dealmytime Services Private Limited understands how important
                your privacy is. This policy describes the Personal Information
                we collect, how we use it, how we share it, how we protect it,
                and your rights over it.
              </p>

              <p>
                By using the Website or availing our Services, you confirm that
                you have read, understood, and expressly consented to this
                Privacy Policy. This policy may be updated at any time without
                notice — please review it periodically.
              </p>
            </div>

            {sections.map((section, idx) => {
              return (
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
              );
            })}
          </div>

          <div className="mt-4">
            <AlertCard variant="blue">
              We use cookies to enhance your experience. Session cookies are
              deleted at the end of each session. You may decline cookies via
              your browser settings, though this may limit certain Website
              features.
            </AlertCard>
          </div>
        </div>
      </div>
    </div>
  );
}
