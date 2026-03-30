import AlertCard from "@/src/components/ui/AlertCard";
import React, { useState, useEffect } from "react";

const sections = [
  {
    id: "collection",
    label: "A. Information We Collect",
    short: "Info We Collect",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed mb-4">
          We collect Personal Information through the Website, which includes
          any information that relates to a User and is capable of identifying
          such User, either directly or indirectly.
        </p>
        <div className="space-y-3">
          {[
            {
              title: "Contact Information",
              desc: "Full name, company name, designation, business email address, registered office address, and phone number.",
            },
            {
              title: "User Details",
              desc: "Age, sex, date of birth, nationality, government identification documents, social media account details, and other similar details.",
            },
            {
              title: "Financial Information",
              desc: "Payment instrument information, transaction details, transaction history, preferences, method, mode and manner of payment, spending patterns or trends, and other similar information.",
            },
            {
              title: "Technical Information",
              desc: "IP addresses, access and server logs, website usage data, device identifiers, real-time geographic location (if permitted), and details of services availed.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">
                  {item.title}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            The Website may request permissions such as sending messages and
            accessing real-time location. You may decline, though this may limit
            our ability to provide Services. Where possible, we indicate which
            fields are mandatory and which are optional.
          </p>
          <p>
            We may automatically track certain information about your activity
            on the Website for internal research on demographics, interests, and
            behaviour — compiled and analysed on an aggregated basis. We may
            also occasionally ask you to complete optional online surveys to
            tailor your experience and display content according to your
            preferences.
          </p>
          <p>
            We use <strong className="text-slate-700">cookies</strong> on
            certain pages to analyse web page flow, measure promotional
            effectiveness, and promote trust and safety. Most cookies are
            session cookies deleted at the end of a session. You may decline
            cookies via your browser, though some features may be unavailable.
            We place both permanent and temporary cookies; none contain
            personally identifiable information.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
              Children under 18
            </p>
            <p className="text-sm text-slate-500">
              We do not knowingly solicit data from or market to children under
              18. If you become aware of any such data collected, please contact
              us at{" "}
              <a
                href="mailto:privacy@aurionone.com"
                className="text-indigo-600 hover:underline"
              >
                privacy@aurionone.com
              </a>
              . We will deactivate the account and promptly delete such data.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "use",
    label: "B. How We Use Your Information",
    short: "How We Use It",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>We use Personal Information for the following purposes:</p>
        <ul className="space-y-2">
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
            <li
              key={point}
              className="flex items-start gap-3 text-sm text-slate-600"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="text-indigo-700 text-sm">
            Where we use your information for marketing purposes, we will
            provide you the ability to opt-out of such communications at any
            time.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "sharing",
    label: "C. Sharing with Third Parties",
    short: "Third Parties",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          We share your Personal Information with third parties under
          appropriate written data protection obligations, including:
        </p>
        <div className="space-y-3">
          {[
            {
              title: "Group Entities",
              desc: "Subsidiaries, affiliates, or group entities to offer their products and services through the Website.",
            },
            {
              title: "Service Providers",
              desc: "For storing, analysing, delivering products, security, customer service, marketing studies, profiling, user analysis, and payment processing.",
            },
            {
              title: "Government Authorities",
              desc: "When required by applicable law or legal process.",
            },
            {
              title: "Third-Party Advertisers",
              desc: "Advertising companies may use cookie and tracking data to serve relevant ads when you visit the Website.",
            },
            {
              title: "Other Third Parties",
              desc: "To enforce Terms of Use, protect against fraud, for risk management, advisory or dispute resolution, or where necessary to protect vital interests.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">
                  {item.title}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
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
    label: "D. Data Protection",
    short: "Data Protection",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
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
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
          <strong className="font-semibold">Important:</strong> We are not
          responsible for breaches caused by third-party actions or Force
          Majeure Events — including acts of government, hacking, natural
          disasters, civil unrest, computer crashes, breach of security and
          encryption, or poor internet service.
        </div>
      </div>
    ),
  },
  {
    id: "rights",
    label: "E. Your Rights",
    short: "Your Rights",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          You have the following rights with respect to your Personal
          Information:
        </p>
        <ul className="space-y-2">
          {[
            "Access, review, and modify your information by logging into your account",
            "Withdraw consent by writing to us at privacy@aurionone.com",
            "Opt-out of promotional mailers via the unsubscribe link in any email",
            "Opt-out of non-essential marketing communications after account setup",
          ].map((right) => (
            <li
              key={right}
              className="flex items-start gap-3 text-sm text-slate-600"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              {right}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "general",
    label: "F. General Terms",
    short: "General Terms",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
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
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
            Data Protection / Grievance Officer
          </p>
          <p className="text-sm text-slate-500 mb-3">
            In accordance with the Information Technology Act 2000, the Digital
            Personal Data Protection Act 2023, and the Digital Personal Data
            Protection Rules 2025:
          </p>
          <div className="space-y-1 text-sm text-slate-600">
            <p>
              <span className="font-medium">Name:</span> Chetan Anchan
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              <a
                href="mailto:Chetan@dealmytime.com"
                className="text-indigo-600 hover:underline"
              >
                Chetan@dealmytime.com
              </a>
            </p>
            <p>
              <span className="font-medium">Address:</span> Unit 115,
              InspireHub, JP Road, 4 Bunglows, Opp Gurudwara, DN Nagar, Andheri
              West – 400058
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {}, []);

  const toggle = (id: string) => {
    setActiveSection((prev) => (prev === id ? null : id));
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="home-section">
      {/* Hero */}
      <div className="mb-10">
        <div className="mb-6 flex items-center gap-2 px-5 py-2 w-fit text-[12px] bg-[#E1EDFF] border border-[#049FD9] rounded-full">
          <span className="flex h-1 w-1 rounded-full bg-black"></span>
          Last updated: March 02, 2026
        </div>

        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-slate-500 leading-relaxed max-w-2xl text-sm">
          Dealmytime Services Private Limited understands how important your
          privacy is. This policy describes the Personal Information we collect,
          how we use it, how we share it, how we protect it, and your rights
          over it.
        </p>
        <p className="text-slate-400 text-xs mt-2">
          By using the Website or availing our Services, you confirm that you
          have read, understood, and expressly consented to this Privacy Policy.
          This policy may be updated at any time without notice — please review
          it periodically.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar navigation */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Contents
            </p>
            <nav className="space-y-0.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    activeSection === s.id
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {s.short}
                </button>
              ))}
            </nav>
          </div>
        </aside>

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

          {/* Accordion Sections */}
          <div className="space-y-2">
            {sections.map((section) => {
              const isOpen = activeSection === section.id;
              return (
                <div
                  key={section.id}
                  id={section.id}
                  className={`rounded-xl border transition-all duration-200 ${
                    isOpen
                      ? "border-slate-300 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggle(section.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span
                      className={`font-semibold text-sm ${isOpen ? "text-slate-900" : "text-slate-700"}`}
                    >
                      {section.label}
                    </span>
                    <svg
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-slate-600" : "text-slate-400"
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact */}
          <div className="mt-8 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
              Contact Us
            </p>
            <p className="text-sm text-slate-500">
              For any questions or comments regarding this Privacy Policy,
              please write to us at{" "}
              <a
                href="mailto:privacy@aurionone.com"
                className="text-indigo-600 hover:underline"
              >
                privacy@aurionone.com
              </a>
              .
            </p>
          </div>

          <div className="mt-4">
            <AlertCard variant="info">
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
