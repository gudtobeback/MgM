import React from "react";

export default function SideBar({
  sections,
  activeSection,
  scrollTo,
}: {
  sections: any;
  activeSection: any;
  scrollTo: any;
}) {
  return (
    <aside className="hidden lg:block w-52 shrink-0">
      <div className="sticky top-10">
        <p className="text-xs font-semibold text-[#717781] uppercase tracking-widest mb-3">
          SECTIONS
        </p>

        <nav className="space-y-1">
          {sections.map((s: any) => (
            <button
              key={s?.id}
              onClick={() => scrollTo(s?.id)}
              className={`px-4 py-2.5 w-full text-left rounded-full text-sm cursor-pointer transition-all ${
                activeSection === s.id
                  ? "bg-[#015C95] text-white font-medium"
                  : "text-[#41474F] hover:text-black hover:bg-slate-100"
              }`}
            >
              {s?.short}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
