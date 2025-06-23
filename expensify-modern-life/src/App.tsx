import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AddMoney from "./pages/AddMoney";
import AddSavings from "./pages/AddSavings";
import AddExpenses from "./pages/AddExpenses";
import MoneyReceived from "./pages/MoneyReceived";
import MoneyGiven from "./pages/MoneyGiven";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";


const queryClient = new QueryClient();

const AppRoutes = () => {

  return (
    <Routes>
      <Route path="/" element={ <ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /> </ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}/>

      <Route path="/add-money" element={<ProtectedRoute><AddMoney /></ProtectedRoute>} />
      <Route path="/add-savings" element={<ProtectedRoute><AddSavings /> </ProtectedRoute>} />
      <Route path="/add-expenses" element={<ProtectedRoute><AddExpenses /></ProtectedRoute>} />
      <Route path="/money-received" element={<ProtectedRoute><MoneyReceived /></ProtectedRoute>} />
      <Route path="/money-given" element={<ProtectedRoute><MoneyGiven /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="expense-planner-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
         <AuthProvider>
          <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
