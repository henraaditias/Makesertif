import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { animate, type JSAnimation } from "animejs";


type AnimeTarget = Parameters<typeof animate>[0];
type AnimeParams = Parameters<typeof animate>[1];

export type Revert = () => void;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function animateSafe(
  target: AnimeTarget | null,
  params: AnimeParams,
): Revert {
  if (!target || prefersReducedMotion()) return () => {};
  let anim: JSAnimation;
  try {
    anim = animate(target, params);
  } catch {
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
    }
  };
}

export interface FadeInOptions {
  duration?: number;
  delay?: number;
  y?: number;
  ease?: AnimeParams["ease"];
}

export function fadeInUp(el: HTMLElement | null, opts: FadeInOptions = {}): Revert {
  if (!el || prefersReducedMotion()) return () => {};
  const { duration = 460, delay = 0, y = 14, ease = "outCubic" } = opts;
  el.style.opacity = "0";
  let anim: JSAnimation;
  try {
    anim = animate(el, {
      opacity: 1,
      y: [y, 0],
      duration,
      delay,
      ease,
      onComplete: () => {
        el.style.opacity = "";
        el.style.transform = "";
      },
    });
  } catch {
    el.style.opacity = "";
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
    }
    el.style.opacity = "";
    el.style.transform = "";
  };
}

export function fadeScale(el: HTMLElement | null, opts: FadeInOptions = {}): Revert {
  if (!el || prefersReducedMotion()) return () => {};
  const { duration = 520, delay = 0, ease = "outBack" } = opts;
  el.style.opacity = "0";
  let anim: JSAnimation;
  try {
    anim = animate(el, {
      opacity: 1,
      scale: [0.72, 1],
      duration,
      delay,
      ease,
      onComplete: () => {
        el.style.opacity = "";
        el.style.transform = "";
      },
    });
  } catch {
    el.style.opacity = "";
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
    }
    el.style.opacity = "";
    el.style.transform = "";
  };
}

export const useAnimationLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface InViewOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useInView(
  ref: RefObject<Element | null>,
  opts: InViewOptions = {},
): boolean {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -8% 0px",
    enabled = true,
  } = opts;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, enabled, threshold, rootMargin]);

  return inView;
}

export function animateScrollToY(targetY: number, duration = 650): Revert {
  const max = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const to = Math.min(Math.max(targetY, 0), max);
  const jump = () => window.scrollTo(0, to);
  if (prefersReducedMotion()) {
    jump();
    return () => {};
  }
  const start = window.scrollY;
  if (Math.abs(to - start) <= 1) return () => {};
  const proxy = { y: start };
  let anim: JSAnimation;
  try {
    anim = animate(proxy, {
      y: to,
      duration,
      ease: "inOutCubic",
      onUpdate: () => window.scrollTo(0, proxy.y),
    });
  } catch {
    jump();
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
    }
  };
}

export function animateScrollElTo(
  el: HTMLElement,
  to: number,
  duration = 480,
): Revert {
  const max = Math.max(0, el.scrollHeight - el.clientHeight);
  const target = Math.min(Math.max(to, 0), max);
  const jump = () => {
    el.scrollTop = target;
  };
  if (prefersReducedMotion()) {
    jump();
    return () => {};
  }
  const start = el.scrollTop;
  if (Math.abs(target - start) <= 1) return () => {};
  const proxy = { y: start };
  let anim: JSAnimation;
  try {
    anim = animate(proxy, {
      y: target,
      duration,
      ease: "outCubic",
      onUpdate: () => {
        el.scrollTop = proxy.y;
      },
    });
  } catch {
    jump();
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
    }
  };
}

export function animateScrollToTop(duration = 650): Revert {
  const jump = () => window.scrollTo(0, 0);
  if (prefersReducedMotion()) {
    jump();
    return () => {};
  }
  const start = window.scrollY;
  if (start <= 0) return () => {};
  const proxy = { y: start };
  let anim: JSAnimation;
  try {
    anim = animate(proxy, {
      y: 0,
      duration,
      ease: "inOutCubic",
      onUpdate: () => window.scrollTo(0, proxy.y),
    });
  } catch {
    jump();
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
    }
  };
}
