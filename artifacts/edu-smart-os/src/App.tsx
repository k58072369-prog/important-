import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import { Layout } from "@/components/layout";
import { OfflineIndicator } from "@/components/offline-indicator";
import { DhikrToast } from "@/components/dhikr-toast";
import { AudioManager } from "@/components/audio-manager";
import { StoreProvider } from "@/lib/store";
import { startAutoBackup } from "@/lib/backup";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppInit() {
  useEffect(() => {
    startAutoBackup();
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <TooltipProvider>
          <AppInit />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <OfflineIndicator />
          <DhikrToast />
          <AudioManager />
        </TooltipProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
