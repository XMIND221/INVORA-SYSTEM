/** Animations premium INVORA — micro-interactions, jamais flashy. */

export const DESIGN_MOTION = {
  durationFast: '180ms',
  durationBase: '320ms',
  durationSlow: '480ms',
  easeEditorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeReveal: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const designMotionClasses = {
  cardHover:
    'transition-[transform,box-shadow] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-lg',
  fadeUp: 'animate-in fade-in slide-in-from-bottom-2 duration-500',
  subtlePulse: 'motion-safe:animate-pulse motion-reduce:animate-none',
  qrGlow:
    'transition-shadow duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_0_24px_oklch(0.72_0.12_0/0.25)]',
} as const;

export const DESIGN_ANIMATION_CSS = `
@keyframes invora-shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
@keyframes invora-reveal {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.invora-design-reveal {
  animation: invora-reveal 0.48s cubic-bezier(0.16, 1, 0.3, 1) both;
}
`;
