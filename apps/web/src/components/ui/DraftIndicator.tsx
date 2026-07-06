import { useEditorStore } from '@/stores/editorStore';
import { useEffect, useState } from 'react';

export default function DraftIndicator() {
  const { isDirty, lastSavedAt } = useEditorStore();
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (isDirty) {
      setDisplayText('● 未保存');
    } else if (lastSavedAt) {
      const seconds = Math.floor((Date.now() - lastSavedAt) / 1000);
      if (seconds < 5) {
        setDisplayText('✓ 已保存');
        const timer = setTimeout(() => setDisplayText(''), 3000);
        return () => clearTimeout(timer);
      } else {
        setDisplayText(`上次保存 ${Math.floor(seconds / 60)} 分钟前`);
      }
    }
  }, [isDirty, lastSavedAt]);

  if (!displayText) return null;

  return (
    <span className={`text-xs transition-opacity duration-300 ${
      isDirty ? 'text-amber-500' : 'text-emerald-500'
    }`}>
      {displayText}
    </span>
  );
}