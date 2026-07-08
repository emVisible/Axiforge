import WriterPanel from "@/features/writer/components/WriterPanel";

interface WriterStudioViewProps {
  source: string;
  roles: Record<string, string>;
  roleNames: string[];
  onChange: (source: string) => void;
  onSave: () => void;
  saving?: boolean;
  dirty?: boolean;
  scrollToLine?: number | null;
  onBeatSelect?: (beat: { id: string; line: number; title: string }) => void;
  onOpenInFlow?: (nodeId: string) => void;
}

export default function WriterStudioView(props: WriterStudioViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WriterPanel {...props} />
    </div>
  );
}
