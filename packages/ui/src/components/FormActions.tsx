import Button from "./Button";

interface FormActionsProps {
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export default function FormActions({
  onSave,
  onCancel,
  saveLabel = "保存",
  cancelLabel = "取消",
  loading,
}: FormActionsProps) {
  return (
    <div className="flex gap-2 pt-1">
      <Button size="sm" onClick={onSave} loading={loading}>
        {saveLabel}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </div>
  );
}
