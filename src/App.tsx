import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SiswaPage from "./pages/Siswa";
import ProdukPage from "./pages/Produk";
import KasirPage from "./pages/Kasir";
import RiwayatMutasiPage from "./pages/RiwayatMutasi";
import SaldoMassalPage from "./pages/SaldoMassal";
import LogPenghapusanPage from "./pages/LogPenghapusan";
import LoginPage from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/siswa" element={<SiswaPage />} />
                <Route path="/produk" element={<ProdukPage />} />
                <Route path="/kasir" element={<KasirPage />} />
                <Route path="/riwayat" element={<RiwayatMutasiPage />} />
                <Route path="/saldo-massal" element={<SaldoMassalPage />} />
                <Route path="/log-penghapusan" element={<LogPenghapusanPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;