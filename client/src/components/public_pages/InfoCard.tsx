export default function InfoCard({ title, desc }: { title?: any; desc?: any }) {
  return (
    <div className="space-y-2 px-5 py-3 bg-[#015C95] border-l-2 border-[#D7FB71] rounded-lg">
      {title && (
        <p className="font-semibold text-sm text-[#D7FB71] leading-relaxed">
          {title}
        </p>
      )}

      <div className="font-light text-sm text-white leading-relaxed">
        {desc}
      </div>
    </div>
  );
}
