import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/features/home/HomePage";
import "./styles.css";

// Each area loads on first visit, so the first screen stays small and fast.
const ChordsPage = lazy(() => import("@/features/chords/ChordsPage"));
const TransitionsPage = lazy(() => import("@/features/transitions/TransitionsPage"));
const StrummingPage = lazy(() => import("@/features/strumming/StrummingPage"));
const ScalesPage = lazy(() => import("@/features/scales/ScalesPage"));
const ScaleDetailPage = lazy(() => import("@/features/scales/ScaleDetailPage"));
const PathPage = lazy(() => import("@/features/path/PathPage"));
const RecallGame = lazy(() => import("@/features/play/RecallGame"));

const page = (el: React.ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "path", element: page(<PathPage />) },
      { path: "play/recall", element: page(<RecallGame />) },
      { path: "chords", element: page(<ChordsPage />) },
      { path: "transitions", element: page(<TransitionsPage />) },
      { path: "strumming", element: page(<StrummingPage />) },
      { path: "scales", element: page(<ScalesPage />) },
      { path: "scales/:id", element: page(<ScaleDetailPage />) },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
