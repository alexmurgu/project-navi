/**
 * Cross-platform haptic feedback utility.
 * Triggers native vibration on supported devices (Android Chrome, Android WebViews, supported iOS browsers)
 * and safely no-ops on unsupported environments.
 */
export const haptic = {
  light: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  },
  medium: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(20);
      } catch {}
    }
  },
  heavy: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(35);
      } catch {}
    }
  },
  success: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([12, 40, 18]);
      } catch {}
    }
  },
  warning: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([25, 40, 25]);
      } catch {}
    }
  },
  error: () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([35, 60, 35]);
      } catch {}
    }
  },
};
