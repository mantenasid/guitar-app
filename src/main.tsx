import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/features/home/HomePage";
import "./styles.css";

// Each area loads on first visit, so the first screen stays small and fast. The shell holds the Suspense boundary, so moving between
// pages keeps the old one on screen until the new one is ready instead of flashing blank.
const ChordsPage = lazy(() => import("@/features/chords/ChordsPage"));
const RingCheck = lazy(() => import("@/features/chords/RingCheck"));
const TransitionsPage = lazy(() => import("@/features/transitions/TransitionsPage"));
const StrummingPage = lazy(() => import("@/features/strumming/StrummingPage"));
const ScalesPage = lazy(() => import("@/features/scales/ScalesPage"));
const ScaleDetailPage = lazy(() => import("@/features/scales/ScaleDetailPage"));
const RecallGame = lazy(() => import("@/features/play/RecallGame"));
const TunerPage = lazy(() => import("@/features/tuner/TunerPage"));
const FretboardPage = lazy(() => import("@/features/fretboard/FretboardPage"));
const PracticePage = lazy(() => import("@/features/practice/PracticePage"));
const GymPage = lazy(() => import("@/features/gym/GymPage"));
const EarPage = lazy(() => import("@/features/ear/EarPage"));
const WarmupsPage = lazy(() => import("@/features/warmups/WarmupsPage"));
const FingerpickingPage = lazy(() => import("@/features/fingerpicking/FingerpickingPage"));
const ArpeggiosPage = lazy(() => import("@/features/arpeggios/ArpeggiosPage"));
const ProgressionsPage = lazy(() => import("@/features/progressions/ProgressionsPage"));

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "play/recall", element: <RecallGame /> },
      { path: "chords", element: <ChordsPage /> },
      { path: "chords/ring", element: <RingCheck /> },
      { path: "transitions", element: <TransitionsPage /> },
      { path: "strumming", element: <StrummingPage /> },
      { path: "scales", element: <ScalesPage /> },
      { path: "scales/:id", element: <ScaleDetailPage /> },
      { path: "tuner", element: <TunerPage /> },
      { path: "fretboard", element: <FretboardPage /> },
      { path: "practice", element: <PracticePage /> },
      { path: "gym", element: <GymPage /> },
      // The old path overview folded into the gym; keep its bookmarks working.
      { path: "path", element: <Navigate to="/gym" replace /> },
      { path: "ear", element: <EarPage /> },
      { path: "warmups", element: <WarmupsPage /> },
      { path: "fingerpicking", element: <FingerpickingPage /> },
      { path: "arpeggios", element: <ArpeggiosPage /> },
      { path: "progressions", element: <ProgressionsPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
