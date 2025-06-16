import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
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
import { useEffect } from "react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // Redirect to homepage if not logged in
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/add-money" element={<AddMoney />} />
      <Route path="/add-savings" element={<AddSavings />} />
      <Route path="/add-expenses" element={<AddExpenses />} />
      <Route path="/money-received" element={<MoneyReceived />} />
      <Route path="/money-given" element={<MoneyGiven />} />
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
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
