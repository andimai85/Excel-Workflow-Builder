import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createHashHistory,
} from "@tanstack/react-router";
import { routeTree } from "../src/routeTree.gen";
import "./styles.css";

const queryClient = new QueryClient();

// Hash history works reliably under file:// in Electron.
const history =
  typeof window !== "undefined" && window.location.protocol === "file:"
    ? createHashHistory()
    : createMemoryHistory({ initialEntries: ["/"] });

const router = createRouter({
  routeTree,
  history,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);