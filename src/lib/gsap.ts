/**
 * Centralized GSAP setup. Registers plugins once and re-exports the
 * configured instances so every component shares the same singleton.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// A signature ease used across the site for that "expensive" deceleration.
export const EASE = "expo.out";
export const EASE_INOUT = "power4.inOut";

export { gsap, ScrollTrigger, SplitText };
