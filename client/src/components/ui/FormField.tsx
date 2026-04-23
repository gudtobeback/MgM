export default function FormField({
  id,
  label,
  className,
  children,
  attachment,
}: {
  id?: any;
  label: any;
  className?: any;
  children?: any;
  attachment?: any;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={`${className} font-bold text-[#015C95]`}>
          {label}
        </label>

        {attachment}
      </div>

      {children}
    </div>
  );
}
