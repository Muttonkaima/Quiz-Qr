import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminPage from "@/pages/admin";
import ParticipantPage from "@/pages/participant";
import QuizInterface from "@/pages/quiz-interface";
import ResultsPage from "@/pages/results";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AdminPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/participant/:quizId" component={ParticipantPage} />
      <Route path="/quiz/:participantId" component={QuizInterface} />
      <Route path="/results/:participantId" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
