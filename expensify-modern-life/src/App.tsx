
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="expense-planner-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
