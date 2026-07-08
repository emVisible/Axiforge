import { useState } from "react";

import Modal, { ModalActions } from "./Modal";
import Textarea from "./Textarea";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  withNote?: boolean;
  notePlaceholder?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  danger = false,
  withNote = false,
  notePlaceholder = "备注（可选）",
  loading = false,
}: ConfirmDialogProps) {
  const [note, setNote] = useState("");

  const handleConfirm = async () => {
    await onConfirm(withNote ? note.trim() || undefined : undefined);
    setNote("");
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} description={description} size="sm">
      <div className={withNote ? "space-y-4" : undefined}>
        {withNote && (
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={notePlaceholder}
            rows={3}
          />
        )}
        <ModalActions
          onCancel={handleClose}
          onConfirm={handleConfirm}
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          confirmVariant={danger ? "danger" : "primary"}
          loading={loading}
        />
      </div>
    </Modal>
  );
}
