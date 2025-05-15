import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/hooks/use-theme";
import { MarketProvider } from "@/hooks/use-market";
import { MarketDataProvider } from "@/context/market-data-context";
import { FinGenieProvider } from "@/contexts/FinGenieContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FinGenie from "@/components/FinGenie";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MarketOverview from "./pages/MarketOverview";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Learn from "./pages/Learn";
import FinPath from "./pages/finpath/index";
import FinWell from "./pages/FinWell";
import Tools from "./pages/Tools";
import CompanyAnalysis from "./pages/CompanyAnalysis";
import FinGeniePage from "./pages/FinGeniePage";
import AdminPanel from "./pages/AdminPanel";

// New Components
import StockDetails from "./components/StockDetails";
import CryptoDetails from "./components/CryptoDetails";
import IndianMarketPage from "./components/IndianMarket/IndianMarketPage";

// New Pages
import AboutPage from "./pages/about/index";
import ContactPage from "./pages/contact/index";
import PricingPage from "./pages/pricing/index";
import FAQPage from "./pages/faq/index";
import TermsPage from "./pages/terms/index";
import PrivacyPage from "./pages/privacy/index";

// Tool Pages
import StockScreenerPage from "./pages/tools/stock-screener/index";
import PortfolioAnalyzerPage from "./pages/tools/portfolio-analyzer/index";
import TechnicalAnalysisPage from "./pages/tools/technical-analysis/index";
import FinGenieToolPage from "./pages/tools/fingenie/index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="system">
        <MarketProvider defaultMarket="global">
          <MarketDataProvider>
            <FinGenieProvider>
              <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/markets" element={<MarketOverview />} />
                  <Route path="/indian-market" element={<IndianMarketPage />} />
                  
                  {/* New static pages */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  
                  {/* Market Categories now handled by query parameters */}
                  
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsDetail />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/fingenie" element={<FinGeniePage />} />
                  <Route path="/company/:symbol" element={<CompanyAnalysis />} />
                  <Route path="/company-analysis/:symbol" element={<CompanyAnalysis />} />
                  
                  {/* New stock and crypto routes */}
                  <Route path="/stocks/:symbol" element={<StockDetails />} />
                  <Route path="/crypto/:coinId" element={<CryptoDetails />} />
                  <Route path="/etfs/:symbol" element={<StockDetails />} />
                  
                  {/* Tool routes */}
                  <Route path="/tools/stock-screener" element={<StockScreenerPage />} />
                  <Route path="/tools/portfolio-analyzer" element={<PortfolioAnalyzerPage />} />
                  <Route path="/tools/technical-analysis" element={<TechnicalAnalysisPage />} />
                  <Route path="/tools/fingenie" element={<FinGenieToolPage />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  
                  {/* FinPath routes - all protected */}
                  <Route path="/finpath" element={
                    <ProtectedRoute>
                      <FinPath />
                    </ProtectedRoute>
                  } />
                  
                  {/* FinWell routes - all protected */}
                  <Route path="/finwell" element={
                    <ProtectedRoute>
                      <FinWell />
                    </ProtectedRoute>
                  } />
                  <Route path="/finwell/:section" element={
                    <ProtectedRoute>
                      <FinWell />
                    </ProtectedRoute>
                  } />
                  
                  {/* Tools routes - all protected */}
                  <Route path="/tools" element={
                    <ProtectedRoute>
                      <Tools />
                    </ProtectedRoute>
                  } />
                  <Route path="/tools/:toolType" element={
                    <ProtectedRoute>
                      <Tools />
                    </ProtectedRoute>
                  } />
                  <Route path="/tools/:toolType/:toolId" element={
                    <ProtectedRoute>
                      <Tools />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Panel - protected route */}
                  <Route path="/admin/fingenie" element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                {/* FinGenie chatbot */}
                <FinGenie />
              </BrowserRouter>
            </AuthProvider>
            </FinGenieProvider>
          </MarketDataProvider>
        </MarketProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
