import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/features/home/HomePage";
import "./styles.css";

// Each area loads on first visit, so the first screen stays small and fast.
const ChordsPage = lazy(() => import("@/features/chords/ChordsPage"));
const TransitionsPage = lazy(() => import("@/features/transitions/TransitionsPage"));
const StrummingPage = lazy(() => import("@/features/strumming/StrummingPage"));
const ScalesPage = lazy(() => import("@/features/scales/ScalesPage"));
const ScaleDetailPage = lazy(() => import("@/features/scales/ScaleDetailPage"));
const RecallGame = lazy(() => import("@/features/play/RecallGame"));
const TunerPage = lazy(() => import("@/features/tuner/TunerPage"));
const FretboardPage = lazy(() => import("@/features/fretboard/FretboardPage"));
const GymPage = lazy(() => import("@/features/gym/GymPage"));
const EarPage = lazy(() => import("@/features/ear/EarPage"));
const WarmupsPage = lazy(() => import("@/features/warmups/WarmupsPage"));
const FingerpickingPage = lazy(() => import("@/features/fingerpicking/FingerpickingPage"));
const ArpeggiosPage = lazy(() => import("@/features/arpeggios/ArpeggiosPage"));
const ProgressionsPage = lazy(() => import("@/features/progressions/ProgressionsPage"));

const page = (el: React.ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "play/recall", element: page(<RecallGame />) },
      { path: "chords", element: page(<ChordsPage />) },
      { path: "transitions", element: page(<TransitionsPage />) },
      { path: "strumming", element: page(<StrummingPage />) },
      { path: "scales", element: page(<ScalesPage />) },
      { path: "scales/:id", element: page(<ScaleDetailPage />) },
      { path: "tuner", element: page(<TunerPage />) },
      { path: "fretboard", element: page(<FretboardPage />) },
      { path: "gym", element: page(<GymPage />) },
      // The old path overview folded into the gym; keep its bookmarks working.
      { path: "path", element: <Navigate to="/gym" replace /> },
      { path: "ear", element: page(<EarPage />) },
      { path: "warmups", element: page(<WarmupsPage />) },
      { path: "fingerpicking", element: page(<FingerpickingPage />) },
      { path: "arpeggios", element: page(<ArpeggiosPage />) },
      { path: "progressions", element: page(<ProgressionsPage />) },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
