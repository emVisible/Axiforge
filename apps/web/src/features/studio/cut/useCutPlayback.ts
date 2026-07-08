import { useCallback, useEffect, useRef, useState } from "react";
import type { Instruction } from "@axiforge/core";
import { clipDurationMs, cursorTimeMs } from "./timelineUtils";

export function useCutPlayback(script: Instruction[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scriptLength = script.length;

  useEffect(() => {
    if (scriptLength <= 0) {
      setSelectedIndex(0);
      setCursorIndex(0);
      setIsPlaying(false);
      return;
    }
    setSelectedIndex((i) => Math.min(i, scriptLength - 1));
    setCursorIndex((i) => Math.min(i, scriptLength - 1));
  }, [scriptLength]);

  const clearPlayTimer = useCallback(() => {
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  const selectClip = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, Math.max(0, scriptLength - 1)));
      setSelectedIndex(clamped);
      setCursorIndex(clamped);
    },
    [scriptLength],
  );

  const scrubTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, Math.max(0, scriptLength - 1)));
      setCursorIndex(clamped);
    },
    [scriptLength],
  );

  const stepPrev = useCallback(() => {
    setIsPlaying(false);
    setSelectedIndex((i) => {
      const next = Math.max(0, i - 1);
      setCursorIndex(next);
      return next;
    });
  }, []);

  const stepNext = useCallback(() => {
    setIsPlaying(false);
    setSelectedIndex((i) => {
      const next = Math.min(scriptLength - 1, i + 1);
      setCursorIndex(next);
      return next;
    });
  }, [scriptLength]);

  const goToStart = useCallback(() => {
    setIsPlaying(false);
    setSelectedIndex(0);
    setCursorIndex(0);
  }, []);

  const goToEnd = useCallback(() => {
    setIsPlaying(false);
    const last = Math.max(0, scriptLength - 1);
    setSelectedIndex(last);
    setCursorIndex(last);
  }, [scriptLength]);

  const togglePlay = useCallback(() => {
    if (scriptLength === 0) return;
    setIsPlaying((p) => !p);
  }, [scriptLength]);

  useEffect(() => {
    if (!isPlaying || scriptLength === 0) {
      clearPlayTimer();
      return;
    }

    const inst = script[cursorIndex];
    const duration = inst ? clipDurationMs(inst) : 800;

    playTimerRef.current = setTimeout(() => {
      if (cursorIndex >= scriptLength - 1) {
        setIsPlaying(false);
        return;
      }
      const next = cursorIndex + 1;
      setCursorIndex(next);
      setSelectedIndex(next);
    }, duration);

    return clearPlayTimer;
  }, [isPlaying, cursorIndex, script, scriptLength, clearPlayTimer]);

  useEffect(() => () => clearPlayTimer(), [clearPlayTimer]);

  const currentTimeMs = cursorTimeMs(script, Math.min(cursorIndex, Math.max(0, scriptLength - 1)));
  const safeCursor =
    scriptLength > 0 ? Math.max(0, Math.min(cursorIndex, scriptLength - 1)) : 0;
  const safeSelected =
    scriptLength > 0 ? Math.max(0, Math.min(selectedIndex, scriptLength - 1)) : 0;

  return {
    selectedIndex: safeSelected,
    cursorIndex: safeCursor,
    isPlaying,
    zoom,
    setZoom,
    currentTimeMs,
    selectClip,
    scrubTo,
    setCursorIndex,
    stepPrev,
    stepNext,
    goToStart,
    goToEnd,
    togglePlay,
    setIsPlaying,
    seekIndex: safeCursor,
  };
}
