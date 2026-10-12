/** The visitor's reduced-motion preference. Read when called, so a stubbed matchMedia in a fixture applies. */
export const reducedMotionQuery = (): MediaQueryList => matchMedia('(prefers-reduced-motion: reduce)');
