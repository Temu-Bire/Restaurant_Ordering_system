import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export default function Checkbox({ label, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-[13px] has-[:disabled]:opacity-60">
      <input type="checkbox" className="size-4 accent-primary" {...props} />
      {label}
    </label>
  );
}