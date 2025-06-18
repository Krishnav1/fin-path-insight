import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/hooks/use-theme";
import { MarketDataProvider } from "@/context/market-data-context";
import { NewsProvider } from "@/context/news-context"; // Added NewsProvider import
import { FinGenieProvider } from "@/contexts/FinGenieContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FinGenie from "@/components/FinGenie";

// Core pages (not lazy loaded for better initial load performance)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fin-primary"></div>
  </div>
);

// Lazy loaded pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const AuthCallback = lazy(() => import("./pages/Auth/Callback"));
const MarketOverview = lazy(() => import("./pages/MarketOverview"));
const USMarket = lazy(() => import("./pages/StocksMarket"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Learn = lazy(() => import("./pages/Learn"));
const FinPath = lazy(() => import("./pages/finpath/index"));
const FinWell = lazy(() => import("./pages/FinWell"));
const Tools = lazy(() => import("./pages/Tools"));
const CompanyAnalysis = lazy(() => import("./pages/CompanyAnalysis"));

const AdminPanel = lazy(() => import("./pages/AdminPanel"));

// Lazy loaded components
const StockDetails = lazy(() => import("./components/StockDetails"));
const CryptoDetails = lazy(() => import("./components/CryptoDetails"));
const IndianMarketPage = lazy(() => import("./components/IndianMarket/IndianMarketPage"));

// Lazy loaded static pages
const AboutPage = lazy(() => import("./pages/about/index"));
const ContactPage = lazy(() => import("./pages/contact/index"));
const PricingPage = lazy(() => import("./pages/pricing/index"));
const FAQPage = lazy(() => import("./pages/faq/index"));
const TermsPage = lazy(() => import("./pages/terms/index"));
const PrivacyPage = lazy(() => import("./pages/privacy/index"));

// Lazy loaded tool pages
const StockScreenerPage = lazy(() => import("./pages/tools/stock-screener/index"));
const TechnicalAnalysisPage = lazy(() => import("./pages/tools/technical-analysis/index"));
const PortfolioAnalyzerPage = lazy(() => import("./pages/tools/portfolio-analyzer/index"));
const FinGenieToolPage = lazy(() => import("./pages/tools/fingenie/index"));

// Optimized React Query client with caching and retry configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
      retry: 1, // Only retry failed queries once
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Garbage collection time (formerly cacheTime)
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme={undefined}> {/* Changed defaultTheme to undefined to potentially fix lint and allow provider default */} 
        <NewsProvider> {/* Added NewsProvider here */}
          <MarketDataProvider>
            <FinGenieProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                  {/* Public routes - Index and NotFound are not lazy loaded */}
                  <Route path="/" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                  
                  {/* Lazy loaded routes wrapped in Suspense */}
                  <Route path="/login" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Login />
                    </Suspense>
                  } />
                  <Route path="/admin/login" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminLogin />
                    </Suspense>
                  } />
                  <Route path="/signup" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Signup />
                    </Suspense>
                  } />
                  <Route path="/forgot-password" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <ForgotPassword />
                    </Suspense>
                  } />
                  <Route path="/reset-password" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <ResetPassword />
                    </Suspense>
                  } />
                  <Route path="/auth/callback" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AuthCallback />
                    </Suspense>
                  } />
                  <Route path="/complete-profile" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <CompleteProfile />
                    </Suspense>
                  } />
                  <Route path="/markets" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <MarketOverview />
                    </Suspense>
                  } />
                  <Route path="/us-market" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <USMarket />
                    </Suspense>
                  } />
                  <Route path="/indian-market" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <IndianMarketPage />
                    </Suspense>
                  } />
                  
                  {/* New static pages */}
                  <Route path="/about" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AboutPage />
                    </Suspense>
                  } />
                  <Route path="/contact" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <ContactPage />
                    </Suspense>
                  } />
                  <Route path="/pricing" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <PricingPage />
                    </Suspense>
                  } />
                  <Route path="/faq" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <FAQPage />
                    </Suspense>
                  } />
                  <Route path="/terms" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <TermsPage />
                    </Suspense>
                  } />
                  <Route path="/privacy" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <PrivacyPage />
                    </Suspense>
                  } />
                  
                  {/* Market Categories now handled by query parameters */}
                  
                  <Route path="/news" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <News />
                    </Suspense>
                  } />
                  <Route path="/news/:id" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <NewsDetail />
                    </Suspense>
                  } />
                  <Route path="/learn" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Learn />
                    </Suspense>
                  } />
                  <Route path="/fingenie" element={<Navigate to="/tools/fingenie" replace />} />
                  <Route path="/company/:symbol" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <CompanyAnalysis />
                    </Suspense>
                  } />
                  <Route path="/company-analysis/:symbol" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <CompanyAnalysis />
                    </Suspense>
                  } />
                  
                  {/* New stock and crypto routes */}
                  <Route path="/stocks/:symbol" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <StockDetails />
                    </Suspense>
                  } />
                  <Route path="/crypto/:coinId" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <CryptoDetails />
                    </Suspense>
                  } />
                  {/* ETF details now handled by stock details */}
                  
                  {/* Tool routes */}
                  <Route path="/tools/stock-screener" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <StockScreenerPage />
                    </Suspense>
                  } />
                  <Route path="/tools/portfolio-analyzer" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <PortfolioAnalyzerPage />
                    </Suspense>
                  } />
                  <Route path="/portfolio" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <PortfolioAnalyzerPage />
                    </Suspense>
                  } />
                  <Route path="/tools/technical-analysis" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <TechnicalAnalysisPage />
                    </Suspense>
                  } />
                  <Route path="/tools/fingenie" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <FinGenieToolPage />
                    </Suspense>
                  } />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <Dashboard />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <Profile />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <Settings />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* FinPath routes - all protected */}
                  <Route path="/finpath" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <FinPath />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/finpath/:section" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <FinPath />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* FinWell routes - all protected */}
                  <Route path="/finwell" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <FinWell />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/finwell/:section" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <FinWell />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Tools routes - all protected */}
                  <Route path="/tools" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <Tools />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/tools/:toolType" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <Tools />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/tools/:toolType/:toolId" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <Tools />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Panel - protected routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Suspense fallback={<LoadingFallback />}>
                        <AdminPanel />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                </Routes>
                
                {/* FinGenie chatbot */}
                <FinGenie />
              </BrowserRouter>
              </AuthProvider>
            </FinGenieProvider>
          </MarketDataProvider>
        </NewsProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
