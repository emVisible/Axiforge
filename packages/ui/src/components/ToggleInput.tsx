import { useState } from "react";
import SearchSelect from "./SearchSelect";
import Input from "./Input";
import Textarea from "./Textarea";

interface ToggleInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  type?: "input" | "textarea";
  rows?: number;
}

export default function ToggleInput({
  value,
  onChange,
  options,
  placeholder = "输入或选择...",
  label,
  type = "input",
  rows = 2,
}: ToggleInputProps) {
  const [mode, setMode] = useState<"select" | "input">(
    options.length > 0 ? "select" : "input",
  );

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {options.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setMode((prev) => (prev === "select" ? "input" : "select"))
              }
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
            >
              {mode === "select" ? "自定义" : "预设"}
            </button>
          )}
        </div>
      )}
      {mode === "select" && options.length > 0 ? (
        <SearchSelect
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
        />
      ) : type === "textarea" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
