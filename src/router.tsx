import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { pageTransitions, trackHistoryPops } from "./lib/page-transitions";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cached data renders instantly; anything older than this is refreshed
        // in the background on mount, focus (app resumed) and reconnect.
        staleTime: 15_000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: 30_000,
      },
    },
  });

  // Before the router exists, so this popstate listener runs ahead of its own.
  trackHistoryPops();

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, user: undefined, session: undefined },
    scrollRestoration: true,
    // Start loading a tab's route on touchstart, before the tap completes.
    defaultPreload: "intent",
    // React Query owns caching; let the router always call the (cheap) loader.
    defaultPreloadStaleTime: 0,
    // iOS-style push/pop for drill-down pages; tabs stay instant.
    defaultViewTransition: pageTransitions,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
