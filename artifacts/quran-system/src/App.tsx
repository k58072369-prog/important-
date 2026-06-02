import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";

// Pages
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Teachers from "@/pages/teachers";
import Circles from "@/pages/circles";
import Sessions from "@/pages/sessions";
import SessionDetail from "@/pages/sessions-id";
import Finance from "@/pages/finance";
import Reports from "@/pages/reports";
import Leaderboard from "@/pages/leaderboard";
import Storage from "@/pages/storage";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/teachers" component={Teachers} />
        <Route path="/circles" component={Circles} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/sessions/:id" component={SessionDetail} />
        <Route path="/finance" component={Finance} />
        <Route path="/reports" component={Reports} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/storage" component={Storage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
