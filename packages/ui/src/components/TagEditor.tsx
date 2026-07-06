import type { KeyboardEvent } from "react";

import Badge from "./Badge";
import type { BadgeVariant } from "./Badge";
import Button from "./Button";
import Input from "./Input";
import { labelSm } from "./formStyles";

interface TagEditorProps {
  label: string;
  tags: string[];
  input: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  variant?: BadgeVariant;
}

export default function TagEditor({
  label,
  tags,
  input,
  onInputChange,
  onAdd,
  onRemove,
  placeholder = "添加标签",
  variant = "brand",
}: TagEditorProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div>
      <label className={labelSm}>{label}</label>
      <div className="mb-2 flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          添加
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge key={tag} variant={variant} size="sm" onRemove={() => onRemove(tag)}>
            {tag}
          </Badge>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-ink-muted/50">暂无</span>
        )}
      </div>
    </div>
  );
}
