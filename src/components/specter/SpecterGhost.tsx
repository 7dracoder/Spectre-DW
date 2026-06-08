import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

type Mood = "idle" | "curious" | "thinking" | "happy";
type Size = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, number> = { sm: 56, md: 88, lg: 128, xl: 180 };

interface SpecterGhostProps {
  mood?: Mood;
  size?: Size;
  className?: string;
  withMagnifier?: boolean;
}

/**
 * Friendly cartoon ghost detective — Specter mascot.
 * Warm cream body, ember cheeks, gentle float, blinking, optional magnifier.
 */
const SpecterGhost = ({
  mood = "idle",
  size = "md",
  className,
  withMagnifier = true,
}: SpecterGhostProps) => {
  const ref = useRef<SVGSVGElement>(null);
  const leftEye = useRef<SVGEllipseElement>(null);
  const rightEye = useRef<SVGEllipseElement>(null);
  const magRef = useRef<SVGGElement>(null);
  const px = sizeMap[size];

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const ctx = gsap.context(() => {
      gsap.to(svg, { y: -5, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(svg, {
        rotation: 2,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "center center",
      });
      if (leftEye.current && rightEye.current) {
        gsap.to([leftEye.current, rightEye.current], {
          scaleY: 0.08,
          duration: 0.14,
          repeat: -1,
          yoyo: true,
          repeatDelay: 3.5,
          transformOrigin: "center center",
          ease: "power2.inOut",
        });
      }
      if (magRef.current && withMagnifier) {
        gsap.to(magRef.current, {
          rotation: 8,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          transformOrigin: "30px 50px",
        });
      }
    }, svg);
    return () => ctx.revert();
  }, [withMagnifier]);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (mood === "happy") {
      gsap.fromTo(svg, { scale: 1 }, { scale: 1.08, duration: 0.25, yoyo: true, repeat: 1, ease: "back.out(2)", transformOrigin: "center center" });
    } else if (mood === "curious") {
      gsap.fromTo(svg, { rotation: 0 }, { rotation: -8, duration: 0.4, yoyo: true, repeat: 1, ease: "power2.inOut", transformOrigin: "center center" });
    }
  }, [mood]);

  return (
    <svg
      ref={ref}
      width={px}
      height={px}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ghost-body" cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f4ede0" />
        </radialGradient>
        <filter id="ghost-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dy="2" />
          <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* soft floor shadow */}
      <ellipse cx="60" cy="112" rx="26" ry="3" fill="#000" opacity="0.07" />

      {/* body */}
      <g filter="url(#ghost-shadow)">
        <path
          d="M28 56 C28 36, 44 22, 60 22 C76 22, 92 36, 92 56 L92 96
             C92 100, 88 102, 85 99 L80 94 C78 92, 75 92, 73 94 L68 99
             C66 101, 63 101, 61 99 L56 94 C54 92, 51 92, 49 94 L44 99
             C42 101, 39 101, 37 99 L32 94 C29 91, 28 92, 28 96 Z"
          fill="url(#ghost-body)"
          stroke="#2a2520"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* cheeks */}
        <circle cx="40" cy="62" r="5" fill="hsl(14 79% 60%)" opacity="0.35" />
        <circle cx="80" cy="62" r="5" fill="hsl(14 79% 60%)" opacity="0.35" />

        {/* eyes */}
        <ellipse ref={leftEye} cx="48" cy="52" rx="3.2" ry="4" fill="#2a2520" />
        <ellipse ref={rightEye} cx="72" cy="52" rx="3.2" ry="4" fill="#2a2520" />
        <circle cx="49.2" cy="50.5" r="1" fill="#fff" />
        <circle cx="73.2" cy="50.5" r="1" fill="#fff" />

        {/* mouth */}
        {mood === "thinking" ? (
          <path d="M55 66 Q60 64 65 66" stroke="#2a2520" strokeWidth="2" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M54 64 Q60 70 66 64" stroke="#2a2520" strokeWidth="2" strokeLinecap="round" fill="none" />
        )}
      </g>

      {/* magnifier */}
      {withMagnifier && (
        <g ref={magRef}>
          <circle cx="92" cy="78" r="13" fill="hsl(0 0% 100% / 0.6)" stroke="#2a2520" strokeWidth="2.2" />
          <circle cx="92" cy="78" r="13" fill="hsl(200 80% 70% / 0.18)" />
          <line x1="101" y1="87" x2="110" y2="96" stroke="#2a2520" strokeWidth="3.4" strokeLinecap="round" />
          <line x1="101" y1="87" x2="110" y2="96" stroke="hsl(14 79% 57%)" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

export default SpecterGhost;
