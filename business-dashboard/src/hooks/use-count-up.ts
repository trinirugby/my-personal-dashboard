"use client";

import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    if (typeof window === "undefined") {
      setValue(target);
      return;
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    const from = startedRef.current ? value : 0;
    fromRef.current = from;
    startedRef.current = true;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // We intentionally only restart on `target` changes, not on `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
