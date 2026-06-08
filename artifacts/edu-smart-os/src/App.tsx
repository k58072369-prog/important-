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
import { clearAllData } from "@/lib/seed";
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
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const DEMO_CLEARED_KEY = "furqan_demo_data_cleared_v1";

type AppPhase = "intro" | "app";

function getInitialPhase(): AppPhase {
  try {
    return shouldShowIntro() ? "intro" : "app";
  } catch {
    return "app";
  }
}

/** Wraps a page component in a section-level ErrorBoundary so one broken page
 *  never crashes the whole shell. The name is shown in the Arabic error message. */
function Page({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary section={name}>
      {children}
    </ErrorBoundary>
  );
}

function AppInit() {
  useEffect(() => {
    try { startAutoBackup(); } catch { /* non-fatal */ }
    backfillStudentCodes().catch(() => {});

    // One-time: clear any previously auto-seeded demo data
    if (!localStorage.getItem(DEMO_CLEARED_KEY)) {
      localStorage.setItem(DEMO_CLEARED_KEY, "1");
      localStorage.removeItem("furqan_demo_seeded_v1");
      localStorage.removeItem("furqan_demo_seeded_v2");
      clearAllData().catch(() => {});
    }
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
                  <Route path="/" component={() => <Page name="لوحة التحكم"><Dashboard /></Page>} />
                  <Route path="/students" component={() => <Page name="الطلاب"><Students /></Page>} />
                  <Route path="/teachers" component={() => <Page name="المعلمون"><Teachers /></Page>} />
                  <Route path="/circles" component={() => <Page name="الحلقات"><Circles /></Page>} />
                  <Route path="/sessions" component={() => <Page name="الحصص"><Sessions /></Page>} />
                  <Route path="/courses" component={() => <Page name="الدورات"><Courses /></Page>} />
                  <Route path="/competitions" component={() => <Page name="المسابقات"><Competitions /></Page>} />
                  <Route path="/competition-leaderboard" component={() => <Page name="صدارة المسابقات"><CompetitionLeaderboard /></Page>} />
                  <Route path="/finance" component={() => <Page name="الشؤون المالية"><Finance /></Page>} />
                  <Route path="/notifications" component={() => <Page name="الإشعارات"><Notifications /></Page>} />
                  <Route path="/leaderboard" component={() => <Page name="لوحة الصدارة"><Leaderboard /></Page>} />
                  <Route path="/reports" component={() => <Page name="التقارير"><Reports /></Page>} />
                  <Route path="/monthly-reports" component={() => <Page name="التقارير الشهرية"><MonthlyReports /></Page>} />
                  <Route path="/trash" component={() => <Page name="سلة المحذوفات"><TrashPage /></Page>} />
                  <Route path="/activity-log" component={() => <Page name="سجل العمليات"><ActivityLogPage /></Page>} />
                  <Route path="/competition-stats" component={() => <Page name="إحصائيات المسابقات"><CompetitionStats /></Page>} />
                  <Route path="/search" component={() => <Page name="البحث المتقدم"><SearchPage /></Page>} />
                  <Route path="/help" component={() => <Page name="مركز المساعدة"><Help /></Page>} />
                  <Route path="/video-settings" component={() => <Page name="الفيديو الافتتاحي"><VideoSettings /></Page>} />
                  <Route path="/settings" component={() => <Page name="الإعدادات"><SettingsPage /></Page>} />
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
