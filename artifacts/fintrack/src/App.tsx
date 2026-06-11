import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";
import Overview from "@/pages/Overview";
import Transactions from "@/pages/Transactions";
import Budget from "@/pages/Budget";
import Investments from "@/pages/Investments";
import Reports from "@/pages/Reports";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/budget" component={Budget} />
        <Route path="/investments" component={Investments} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
