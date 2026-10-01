const supportsSecureServiceWorker =
  typeof window !== "undefined" &&
  window.isSecureContext &&
  window.top === window.self &&
  (window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!supportsSecureServiceWorker) return;

  const register = () => {
    const buildId = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "v1";

    navigator.serviceWorker
      .register(`/sw.js?v=${buildId}`, {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => {
        const notifyUpdateAvailable = () => {
          if (!navigator.serviceWorker.controller) return;
          window.dispatchEvent(
            new CustomEvent("pwa-update-available", {
              detail: { registration },
            }),
          );
        };

        if (registration.waiting) {
          notifyUpdateAvailable();
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdateAvailable();
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.dispatchEvent(new CustomEvent("pwa-controller-changed"));
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "SecurityError") {
          return;
        }
        console.error("Service worker registration failed:", error);
      });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register);
  }
}
