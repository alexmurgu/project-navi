import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./globals.css";

import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: "always",
      refetchOnReconnect: "always",
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient, user: undefined, session: undefined },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const supportsSecureServiceWorker =
  window.isSecureContext &&
  window.top === window.self &&
  (window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

if ("serviceWorker" in navigator && supportsSecureServiceWorker) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${__APP_BUILD_ID__}`, {
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

        const handleWaitingWorker = () => notifyUpdateAvailable();

        if (registration.waiting) {
          notifyUpdateAvailable();
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              handleWaitingWorker();
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
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);

document.getElementById("boot-screen")?.remove();
