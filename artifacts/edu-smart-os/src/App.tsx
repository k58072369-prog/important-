import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { Layout } from "@/components/layout";
import { OfflineIndicator } from "@/components/offline-indicator";
import { DhikrToast } from "@/components/dhikr-toast";
import { AudioManager } from "@/components/audio-manager";
import { IntroScreen } from "@/components/intro-screen";
import { StoreProvider } from "@/lib/store";
import { startAutoBackup } from "@/lib/backup";
import { shouldShowIntro } from "@/lib/splash-settings";
import { backfillStudentCodes } from "@/lib/store";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Teachers from "@/pages/teachers";
import Circles from "@/pages/circles";
import Sessions from "@/pages/sessions";
import Finance from "@/pages/finance";
import Notifications from "@/pages/notifications";
import Leaderboard from "@/pages/leaderboard";
import Courses from "@/pages/courses";
import Competitions from "@/pages/competitions";
import CompetitionLeaderboard from "@/pages/competition-leaderboard";
import Reports from "@/pages/reports";
import MonthlyReports from "@/pages/monthly-reports";
import TrashPage from "@/pages/trash";
import ActivityLogPage from "@/pages/activity-log";
import CompetitionStats from "@/pages/competition-stats";
import SearchPage from "@/pages/search";
import Help from "@/pages/help";
import VideoSettings from "@/pages/video-settings";
import NotFound from "@/pages/not-found";

type AppPhase = "intro" | "app";

function getInitialPhase(): AppPhase {
  try {
    return shouldShowIntro() ? "intro" : "app";
  } catch {
    return "app";
  }
}

function AppInit() {
  useEffect(() => {
    startAutoBackup();
    backfillStudentCodes().catch(() => {});
  }, []);
  return null;
}

function MainApp() {
  return (
    <div dir="rtl" className="min-h-[100dvh] font-sans bg-background text-foreground">
      <ErrorBoundary>
        <StoreProvider>
          <TooltipProvider>
            <AppInit />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Layout>
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/students" component={Students} />
                  <Route path="/teachers" component={Teachers} />
                  <Route path="/circles" component={Circles} />
                  <Route path="/sessions" component={Sessions} />
                  <Route path="/courses" component={Courses} />
                  <Route path="/competitions" component={Competitions} />
                  <Route path="/competition-leaderboard" component={CompetitionLeaderboard} />
                  <Route path="/finance" component={Finance} />
                  <Route path="/notifications" component={Notifications} />
                  <Route path="/leaderboard" component={Leaderboard} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/monthly-reports" component={MonthlyReports} />
                  <Route path="/trash" component={TrashPage} />
                  <Route path="/activity-log" component={ActivityLogPage} />
                  <Route path="/competition-stats" component={CompetitionStats} />
                  <Route path="/search" component={SearchPage} />
                  <Route path="/help" component={Help} />
                  <Route path="/video-settings" component={VideoSettings} />
                  <Route component={NotFound} />
                </Switch>
              </Layout>
            </WouterRouter>
            <Toaster />
            <OfflineIndicator />
            <DhikrToast />
            <AudioManager />
          </TooltipProvider>
        </StoreProvider>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  const [phase, setPhase] = useState<AppPhase>(getInitialPhase);

  function enterApp() {
    setPhase("app");
  }

  if (phase === "intro") {
    return (
      <ErrorBoundary fallback={<MainApp />}>
        <IntroScreen onDone={enterApp} />
      </ErrorBoundary>
    );
  }

  return <MainApp />;
}

export default App;
