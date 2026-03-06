import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Accounts from "./pages/Accounts";
import Budgets from "./pages/Budgets";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/budgets" component={Budgets} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full bg-background overflow-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-16 flex items-center px-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 lg:hidden">
                <SidebarTrigger className="text-foreground hover:bg-secondary rounded-lg" />
                <span className="ml-4 font-display font-bold text-lg">WealthWise</span>
              </header>
              <main className="flex-1 overflow-y-auto w-full relative">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
