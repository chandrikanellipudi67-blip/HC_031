import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import './i18n/config';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import Favorites from "./pages/Favorites";
import Emergency from "./pages/Emergency";
import Profile from "./pages/Profile";
import ResourceDetail from "./pages/ResourceDetail";
import NotFound from "./pages/NotFound";
import { PHRProvider } from '@/features/phr/PHRContext';
import PHRLogin from '@/pages/phr/Login';
import PatientDashboard from '@/pages/phr/PatientDashboard';
import DoctorDashboard from '@/pages/phr/DoctorDashboard';
import AddRecord from '@/pages/phr/AddRecord';
import Reminders from '@/pages/phr/Reminders';
import ExportShare from '@/pages/phr/ExportShare';
import QRCard from '@/pages/phr/QRCard';
import PatientRecord from '@/pages/phr/PatientRecord';
import Chat from '@/pages/phr/Chat';
import FindProvider from '@/pages/phr/FindProvider';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Set RTL for Arabic
    const direction = localStorage.getItem('language') === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <PHRProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/emergency" element={<Emergency />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/resource/:id" element={<ResourceDetail />} />

                  {/* PHR Routes */}
                  <Route path="/phr/login" element={<PHRLogin />} />
                  <Route path="/phr/patient" element={<PatientDashboard />} />
                  <Route path="/phr/doctor" element={<DoctorDashboard />} />
                  <Route path="/phr/add" element={<AddRecord />} />
                  <Route path="/phr/reminders" element={<Reminders />} />
                  <Route path="/phr/export" element={<ExportShare />} />
                  <Route path="/phr/qr" element={<QRCard />} />
                  <Route path="/phr/record/:id" element={<PatientRecord />} />
                  <Route path="/phr/chat" element={<Chat />} />
                  <Route path="/phr/find-provider" element={<FindProvider />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PHRProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
