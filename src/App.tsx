import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import BusinessSignup from "./pages/BusinessSignup";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Transfer from "./pages/Transfer";
import History from "./pages/History";
import Expenses from "./pages/Expenses";
import BillPay from "./pages/BillPay";
import Statements from "./pages/Statements";
import InternationalTransfer from "./pages/InternationalTransfer";
import Notifications from "./pages/Notifications";
import CreditScore from "./pages/CreditScore";
import SubAccounts from "./pages/SubAccounts";
import TeamManagement from "./pages/TeamManagement";
import Invoicing from "./pages/Invoicing";
import Admin from "./pages/Admin";
import ReversalHistory from "./pages/ReversalHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/business-signup" element={<BusinessSignup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/history" element={<History />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/bill-pay" element={<BillPay />} />
            <Route path="/statements" element={<Statements />} />
            <Route path="/international" element={<InternationalTransfer />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/credit-score" element={<CreditScore />} />
            <Route path="/sub-accounts" element={<SubAccounts />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/invoicing" element={<Invoicing />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/reversals" element={<ReversalHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
