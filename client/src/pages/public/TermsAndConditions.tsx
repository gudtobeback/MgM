import AlertCard from "@/src/components/ui/AlertCard";
import React, { useState, useEffect, useRef } from "react";

type Section = {
  id: string;
  label: string;
  short: string;
  content: React.ReactNode;
};

const sections: Section[] = [
  {
    id: "definitions",
    label: "1. Definitions",
    short: "Key Terms",
    content: (
      <div className="space-y-3">
        {[
          {
            term: "Company",
            def: "Dealmytime Services Private Limited, including its successors and permitted assigns.",
          },
          {
            term: "Platform",
            def: "The Company's web-based configuration management system accessible via the Website.",
          },
          {
            term: "Services",
            def: "Configuration backup, migration support, rollback functionality, audit logging, and related configuration management features provided through the Platform.",
          },
          {
            term: "User",
            def: "Any individual accessing or using the Website or Services, whether on their own behalf or on behalf of a legal entity. If you use the Services on behalf of an entity, you represent that you are authorized to bind that entity.",
          },
          {
            term: "Website",
            def: "The official website operated by the Company, including all subdomains, dashboards, login portals, web applications, and interfaces, mobile applications, and any other digital platform or interface through which the Services are made available by the Company.",
          },
        ].map(({ term, def }) => (
          <div
            key={term}
            className="grid grid-cols-[140px_1fr] gap-4 py-3 border-b border-slate-100 last:border-0"
          >
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider pt-0.5">
              {term}
            </span>
            <span className="text-sm text-slate-500 leading-relaxed">
              {def}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "scope",
    label: "2. Nature & Scope",
    short: "Scope",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          The Company provides a web-based platform that helps Users manage and
          organise their system setups. The Services allow Users to create full
          backups of their systems, restore previous versions, and apply their
          saved system setups to other systems.
        </p>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-sm">
          <strong className="font-semibold">Important:</strong> The Platform
          only works with system information Users choose to share through
          supported third-party systems. The Company does not access, view, or
          handle your network traffic, personal messages, files, financial data,
          or live system data.
        </div>
        <p>
          The Services depend on the availability and functionality of
          third-party systems and APIs. The Company does not control such
          third-party systems and cannot guarantee uninterrupted access or
          performance if those systems are changed, restricted, or discontinued.
        </p>
        <p>
          The Platform is a technical tool intended to support configuration
          management — it does not replace the User's internal review, approval,
          testing, or change management processes.{" "}
          <strong className="text-slate-700 font-medium">
            Users remain fully responsible for reviewing and approving all
            configuration changes before implementation.
          </strong>{" "}
          The Company is not responsible for any operational impact resulting
          from configuration changes initiated by the User.
        </p>
        <p>
          The Platform is not designed to process sensitive personal data,
          financial information, payment credentials, or regulated content
          categories. The Services shall not be construed as network monitoring,
          managed security, compliance certification, data hosting, or traffic
          analytics services.
        </p>
      </div>
    ),
  },
  {
    id: "license",
    label: "3. License Grant",
    short: "License",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          Subject to your compliance with this Agreement, the Company grants you
          a{" "}
          <strong className="text-slate-700 font-medium">
            limited, non-exclusive, non-transferable, non-sublicensable,
            revocable license
          </strong>{" "}
          to access and use the Platform through the Website solely for your
          internal business operations and only in connection with supported
          third-party systems for which you have valid authorization. This
          license does not constitute a sale of the Platform or any related
          intellectual property.
        </p>
        <p>
          The Platform is made available on a hosted SaaS basis only. No source
          code, architecture, algorithms, or proprietary methodologies are
          licensed or transferred. All rights not expressly granted are reserved
          by the Company.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { label: "Cannot assign or sublicense", icon: "✗" },
            {
              label: "Cannot share credentials outside authorised staff",
              icon: "✗",
            },
            { label: "Cannot reverse engineer or decompile", icon: "✗" },
            { label: "Breach terminates license automatically", icon: "✗" },
          ].map(({ label, icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg"
            >
              <span className="text-red-400 font-bold text-sm">{icon}</span>
              <span className="text-sm text-red-700">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-sm">
          The Company reserves the right to modify, suspend, or discontinue any
          feature at its sole discretion, provided this does not fundamentally
          deprive the User of the core licensed use during an active
          subscription period. Nothing in this Agreement shall be interpreted as
          granting any ownership rights, IP rights, or implied licenses in or to
          the Platform, Website, or any related documentation or trademarks.
        </p>
      </div>
    ),
  },
  {
    id: "subscription",
    label: "4. Subscription & Fees",
    short: "Billing",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          Access is provided on a subscription basis per the plan selected at
          registration. Subscriptions are purchased for a fixed monthly or
          annual term and{" "}
          <strong className="text-slate-700 font-medium">
            automatically renew
          </strong>{" "}
          for successive terms of equal duration unless cancelled prior to the
          renewal date. Continued access following renewal constitutes
          acceptance of the renewed term and applicable fees.
        </p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
            Fee Terms
          </p>
          <ul className="space-y-1.5">
            {[
              "All fees are paid in advance and are exclusive of applicable taxes, levies, or governmental charges",
              "Subscription fees are non-refundable and non-cancellable except where required by applicable law",
              "The Company may revise fees upon renewal with reasonable prior notice",
              "Continued use after notice constitutes acceptance of revised pricing",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-slate-500">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p>
          Usage is subject to plan limits (number of authorised users, connected
          systems or organisations, backup volume, API usage thresholds, feature
          availability tiers). Exceeding limits may result in upgrade
          requirements, additional charges, suspension of excess usage, or
          access restriction until compliance is restored.
        </p>
        <p>
          You may upgrade your plan at any time subject to prorated charges.
          Downgrades take effect at the end of the current term — no refunds or
          credits are issued for unused portions of a higher-tier plan.
        </p>
        <p>
          Access may be suspended without liability for non-payment, Agreement
          breach, suspected misuse, security threats, or activity adversely
          affecting system stability. Where practicable, notice will be provided
          before suspension.
        </p>
      </div>
    ),
  },
  {
    id: "responsibilities",
    label: "5. User Responsibilities",
    short: "Your Duties",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          You are solely responsible for ensuring you have all necessary rights,
          authorisations, and administrative permissions to connect the Platform
          to any third-party systems, networks, or environments. By initiating
          any integration or configuration activity, you represent and warrant
          that you are duly authorised to access and modify the relevant
          systems.
        </p>
        <ul className="space-y-2">
          {[
            "Independently review, validate, and approve all configuration changes, migrations, and rollback operations prior to and after execution",
            "Implement internal governance procedures, change-management workflows, and testing protocols before applying changes to production environments",
            "Maintain adequate backup strategies and risk mitigation controls — the Platform is not a substitute for independent system oversight or disaster recovery planning",
            "Ensure use complies with all applicable laws, regulations, industry standards, and third-party contractual obligations",
            "Not transmit, store, or embed malicious code, harmful scripts, or unauthorised automation routines that could interfere with systems",
            "Safeguard account credentials and promptly report any unauthorised access, credential compromise, or security incidents",
            "Not impose excessive load on the Platform through automated scripts or bulk operations beyond your subscription plan",
            "Not introduce sensitive personal data, financial information, or regulated data into configuration fields or system metadata",
            "Cooperate in good faith with any security investigation, technical incident, or compliance inquiry",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-slate-600">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "prohibited",
    label: "6. Prohibited Uses",
    short: "Restrictions",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          The following are strictly prohibited and constitute a material breach
          of this Agreement:
        </p>
        <div className="space-y-2">
          {[
            "Disrupting, degrading, or interfering with the integrity, performance, availability, or security of the Platform",
            "Automated extraction, scraping, crawling, data harvesting, stress testing, load testing, or high-volume automated activities beyond the subscription scope",
            "Probing, scanning, testing the vulnerability of, or circumventing technical safeguards, rate limits, or access controls",
            "Reverse engineering, decompiling, disassembling, or attempting to derive the Platform's source code",
            "Copying, modifying, translating, adapting, or creating derivative works of the Platform",
            "Using the Platform to develop a competing product or service",
            "Accessing the Platform for benchmarking, performance testing, or competitive analysis without prior written consent",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
            >
              <span className="text-red-400 font-bold mt-0.5 shrink-0">✕</span>
              <span className="text-sm text-red-700">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Any use in contravention of this Clause may result in immediate
          suspension or termination of access, without prejudice to any other
          rights or remedies available to the Company.
        </p>
      </div>
    ),
  },
  {
    id: "thirdparty",
    label: "7. Third-Party Systems",
    short: "Third Parties",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          The Platform may integrate with or rely on third-party systems, cloud
          infrastructure providers, application marketplaces, operating systems,
          and APIs ("Third-Party Platforms") owned and operated by independent
          entities over whom the Company has no control.
        </p>
        <p>
          The Company is not responsible for interruptions, degradation, or loss
          arising from:
        </p>
        <ul className="space-y-1.5 ml-2">
          {[
            "Outages or service disruptions of Third-Party Platforms",
            "Changes to API structures, rate limits, or integration permissions",
            "Modifications to mobile operating systems or device environments",
            "Removal, suspension, or restriction of the application from any marketplace",
            "Revocation or limitation of credentials issued by third-party systems",
            "Security incidents or failures originating within Third-Party Platforms",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-slate-500">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p>
          You are responsible for ensuring your devices, operating systems, and
          connected systems meet the technical requirements necessary to access
          the Services. You must also comply with all terms governing your
          access to any connected Third-Party Platforms. No third party shall be
          deemed responsible for the Company's obligations under this Agreement,
          and vice versa.
        </p>
      </div>
    ),
  },
  {
    id: "data",
    label: "8. Data & Privacy",
    short: "Data",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          The Platform operates solely as a configuration management and backup
          tool at the control plane level. It does not inspect, monitor,
          intercept, or process network traffic, communications content, payment
          information, financial transaction data, or end-user personal data
          transmitted through the User's network infrastructure.
        </p>
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="font-semibold text-indigo-800 text-xs uppercase tracking-wider mb-2">
            Configuration Data Only
          </p>
          <p className="text-indigo-700 text-sm">
            Data stored is limited to configuration metadata — firewall rules,
            VLAN identifiers, SSID settings, configuration parameters, device
            mappings, audit logs of configuration changes, and similar technical
            records. This does not constitute customer content or transactional
            data.
          </p>
        </div>
        <p>
          The Company does not act as a processor or sub-processor of personal
          data belonging to your customers or end-users.{" "}
          <strong className="text-slate-700 font-medium">
            You must not upload, transmit, or embed personal data, financial
            information, payment data, or regulated sensitive information into
            configuration fields or audit logs.
          </strong>
        </p>
        <p>
          The Company implements commercially reasonable administrative and
          technical safeguards appropriate to the limited nature of
          Configuration Data processed. However, you remain solely responsible
          for determining whether the Services meet your internal regulatory,
          contractual, or compliance requirements.
        </p>
        <p>
          Personal data processing related to your account is governed by the{" "}
          <span className="text-indigo-600 font-medium">Privacy Policy</span>,
          which forms an integral part of this Agreement. In any inconsistency
          between this Agreement and the Privacy Policy on personal data, the
          Privacy Policy prevails.
        </p>
      </div>
    ),
  },
  {
    id: "ip",
    label: "9. Intellectual Property",
    short: "IP",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          The Website, including any mobile application, and the Services,
          together with all software, source code, object code, algorithms,
          interfaces, workflows, designs, documentation, visual interfaces,
          trade names, trademarks, logos, and all enhancements, modifications,
          updates, and derivative works thereof (collectively, "Company
          Intellectual Property") are and shall remain the exclusive property of
          the Company.
        </p>
        <p>
          No right, title, or interest in Company Intellectual Property is
          transferred to you. All rights not expressly granted are reserved. You
          shall not remove, obscure, or alter any proprietary notices,
          trademarks, or copyright notices within the Website or Services.
        </p>
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
          <p className="font-semibold text-green-800 text-xs uppercase tracking-wider mb-2">
            Your Configuration Data
          </p>
          <p className="text-green-700 text-sm">
            You retain all rights, title, and interest in your Configuration
            Data. You grant the Company a limited, non-exclusive, worldwide,
            royalty-free license to host, process, store, and transmit
            Configuration Data solely for the purpose of providing and improving
            the Services.
          </p>
        </div>
        <p>
          Any feedback, suggestions, or recommendations you provide may be used
          by the Company without restriction, obligation, or compensation. You
          hereby grant the Company a perpetual, irrevocable, royalty-free right
          to incorporate such Feedback into the Services or other products.
        </p>
      </div>
    ),
  },
  {
    id: "warranties",
    label: "10. Disclaimer of Warranties",
    short: "Warranties",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-semibold text-amber-800 text-xs uppercase tracking-wider mb-2">
            As-Is Basis
          </p>
          <p className="text-amber-700 text-sm">
            The Services, Website, and all related functionality are provided on
            an "as is" and "as available" basis. To the maximum extent permitted
            by law, the Company disclaims all warranties — express, implied,
            statutory, or otherwise.
          </p>
        </div>
        <ul className="space-y-1.5">
          {[
            "No warranty of merchantability, fitness for a particular purpose, satisfactory quality, or non-infringement",
            "No warranty of uninterrupted availability, accuracy, or reliability",
            "No guarantee that Services will be error-free, secure, or free from defects",
            "No warranty that configuration backups, migrations, or rollbacks will prevent all service interruptions or operational disruptions",
            "No representation regarding continued compatibility with third-party systems, APIs, operating systems, or cloud infrastructure",
            "No warranty created by any oral or written advice from Company representatives",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-slate-500">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-300 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-slate-500 text-xs">
          The User assumes full responsibility for reviewing, validating,
          testing, and approving all configuration changes prior to deployment.
          Nothing in this Agreement excludes any warranty that cannot be
          excluded under applicable law.
        </p>
      </div>
    ),
  },
  {
    id: "liability",
    label: "11. Limitation of Liability",
    short: "Liability",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <div className="p-4 bg-slate-800 text-white rounded-lg">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">
            Liability Cap
          </p>
          <p className="text-white text-sm leading-relaxed">
            The Company's aggregate cumulative liability shall not exceed the
            total subscription fees actually paid by the User during the{" "}
            <strong>3 months immediately preceding</strong> the event giving
            rise to the claim.
          </p>
        </div>
        <p>
          The Company shall not be liable for any indirect, incidental,
          consequential, special, exemplary, or punitive damages, including loss
          of profits, revenue, business opportunity, goodwill, business
          interruption, loss of data, or cost of substitute services.
        </p>
        <p>Specific exclusions include damages arising from:</p>
        <ul className="space-y-1.5">
          {[
            "Configuration errors, misconfigurations, or deployment decisions made by the User",
            "Migration, rollback, or configuration changes implemented by the User",
            "Outages, API changes, access restrictions, or service failures attributable to Third-Party Platforms",
            "Unauthorized access resulting from the User's failure to safeguard credentials",
            "Incompatibility with third-party systems, devices, or software environments",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-slate-500">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "indemnity",
    label: "12. Indemnity",
    short: "Indemnity",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          You agree to indemnify, defend, and hold harmless the Company, its
          affiliates, directors, officers, agents, and employees from and
          against any claims, losses, damages, liabilities, fines, penalties,
          costs, and expenses arising from:
        </p>
        <ul className="space-y-1.5">
          {[
            "Your use or misuse of the Services",
            "Any configuration changes, migration activities, rollback operations, or deployment decisions you implement through the Platform",
            "Your violation of this Agreement or applicable laws or regulatory requirements",
            "Unauthorized access to third-party systems resulting from your failure to maintain proper credentials or access controls",
            "Any claim made by a third party due to your acts or omissions",
            "Any fraud, misconduct, or negligence on your part",
            "Any personal data or regulated information embedded by you within configuration fields",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-slate-500">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-500">
          The Company's indemnification rights are independent of, and in
          addition to, any other rights and remedies it may have at law or in
          equity, including the right to seek specific performance, restitution,
          or injunctive relief.
        </p>
      </div>
    ),
  },
  {
    id: "termination",
    label: "13. Suspension & Termination",
    short: "Termination",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          The Company may suspend or restrict your access without prior notice
          if you breach this Agreement, threaten Platform security, create legal
          or regulatory risk, have overdue subscription payments, or if
          suspension is required to comply with applicable law or a lawful
          governmental request.
        </p>
        <p>
          You may terminate by discontinuing use and cancelling your
          subscription per the Website's cancellation procedures.{" "}
          <strong className="text-slate-700 font-medium">
            Termination does not entitle you to a refund.
          </strong>{" "}
          You remain liable for any sums owed prior to termination.
        </p>
        <p>
          The Company may terminate upon 15 days' written notice for material
          breach where cure is possible, immediately for incurable breach, or if
          continued provision becomes commercially impracticable or legally
          restricted.
        </p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">
            Upon Termination
          </p>
          <ul className="space-y-1.5">
            {[
              "Your right to access and use the Services ceases immediately",
              "The Company may deactivate or delete your account",
              "The Company has no obligation to maintain Configuration Data beyond a reasonable transition period",
              "You are solely responsible for exporting your Configuration Data prior to termination",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-slate-500">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-400">
          Clauses 9 (Intellectual Property), 10 (Disclaimer of Warranties), 11
          (Limitation of Liability), 12 (Indemnity), and 15.1 (Governing Law)
          survive termination of this Agreement.
        </p>
      </div>
    ),
  },
  {
    id: "confidentiality",
    label: "14. Confidentiality",
    short: "Confidentiality",
    content: (
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>
          You agree to keep all Confidential Information of the Company strictly
          confidential and not disclose it to any third party without prior
          written consent. Confidential Information may only be used for the
          purpose of this Agreement and not for personal benefit. You must
          ensure your directors, officers, and employees afforded access to
          Confidential Information are bound by the same obligations.
        </p>
        <p>These obligations do not apply to information that:</p>
        <ul className="space-y-1.5">
          {[
            "Becomes publicly available other than through your disclosure",
            "Must be disclosed under applicable law or judicial or regulatory process (with prior notice to the Company where practicable, and subject to arrangements to protect confidentiality)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-slate-500">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p>
          The Company may publish a general description of work performed under
          this Agreement on its website or third-party platforms to demonstrate
          its experience to potential clients.
        </p>
      </div>
    ),
  },
  {
    id: "miscellaneous",
    label: "15. Miscellaneous",
    short: "General",
    content: (
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        {[
          {
            title: "Governing Law",
            body: "This Agreement is governed in all respects by the laws of India. The courts in Mumbai shall have exclusive jurisdiction over all disputes, differences, controversies, and questions directly or indirectly arising under, out of, or in connection with this Agreement.",
          },
          {
            title: "Entire Agreement",
            body: "This Agreement, together with the Privacy Policy and any subscription terms or pricing plans expressly incorporated by reference, constitutes the entire agreement between the Company and the User and supersedes all prior or contemporaneous understandings, communications, representations, or agreements, whether oral or written.",
          },
          {
            title: "Notices",
            body: "Notices may be sent by email to the address associated with your account, or by email to the Company at the contact details specified on the Website. Email notices are deemed received upon confirmed transmission. You are solely responsible for maintaining an accurate and current email address.",
          },
          {
            title: "Severability",
            body: "If any provision is found invalid or unenforceable, it shall be deemed severed and the parties shall use reasonable efforts to replace it with a provision of equivalent effect. The remaining provisions shall continue in full force.",
          },
          {
            title: "Relationship",
            body: "Nothing in this Agreement creates a relationship of employer, agent, associate, or representative between you and the Company.",
          },
          {
            title: "Force Majeure",
            body: "The Company is not liable for failures or delays caused by forces beyond its control, including strikes, government lockdowns, quarantine restrictions, malware attacks, acts of war or terrorism, civil or military disturbances, nuclear or natural catastrophes, cyber-attacks, or loss or malfunction of utilities, communications, or computer services.",
          },
          {
            title: "No Waiver",
            body: "No waiver of any right is effective unless provided in writing. Failure to enforce any term does not constitute a waiver of the Company's right to enforce it thereafter.",
          },
          {
            title: "Modification",
            body: "The Company may modify this Agreement at any time. Changes become effective upon publication on the Website, unless otherwise stated. Continued use of the Services following publication constitutes acceptance of the revised Agreement.",
          },
        ].map(({ title, body }) => (
          <div
            key={title}
            className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
          >
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className="text-slate-500">{body}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function TermsAndConditions() {
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
          Last updated: March 30, 2026
        </div>

        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
          End User Agreement
        </h1>
        <p className="text-slate-500 leading-relaxed max-w-2xl text-sm">
          This Agreement governs your access to and use of the Dealmytime
          Platform and Services. By clicking "I Agree," registering, accessing
          the Platform, or using the Services, you agree to be legally bound by
          these terms.
        </p>
        <p className="text-slate-400 text-xs mt-2">
          If accepting on behalf of a company or legal entity, you represent
          that you have authority to bind that entity. References to "User"
          shall include such entity.
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

        {/* Accordion sections */}
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

          <div className="mt-8">
            <AlertCard variant="note">
              <p className="uppercase font-semibold">Acceptance</p>
              <p>
                By using the Platform or Services, you acknowledge that you have
                read, understood, and agree to be bound by this Agreement. This
                Agreement may be updated at any time — continued use constitutes
                acceptance of any revised terms.
              </p>
            </AlertCard>
          </div>
        </div>
      </div>
    </div>
  );
}
