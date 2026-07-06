interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export default function CheckboxField({
  checked,
  onChange,
  label,
  className = "",
}: CheckboxFieldProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-sm text-ink-muted ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border text-brand focus:ring-brand/20"
      />
      {label}
    </label>
  );
}
