import { CircleCheck } from "lucide-react";

export default function CheckPoints({ point }: { point: any }) {
  return (
    <li className="flex items-center gap-3 text-sm text-[#41474F] leading-relaxed">
      <CircleCheck size={16} color="#015C95" className="shrink-0" />
      {point}
    </li>
  );
}
