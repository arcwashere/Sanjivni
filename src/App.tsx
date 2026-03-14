import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import IntroPage from "./pages/IntroPage";
import AuthPage from "./pages/AuthPage";
import ParentOverview from "./pages/ParentOverview";
import ExercisePlan from "./pages/ExercisePlan";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/parent/overview" element={<ProtectedRoute requiredRole="parent"><ParentOverview /></ProtectedRoute>} />
          <Route path="/parent/exercise-plan" element={<ProtectedRoute requiredRole="parent"><ExercisePlan /></ProtectedRoute>} />
          <Route path="/caregiver" element={<ProtectedRoute requiredRole="caregiver"><CaregiverDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
