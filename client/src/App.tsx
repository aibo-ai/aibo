import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './context/QueryProvider';

// Context Providers
import { AzureServiceProvider } from './context/AzureServiceContext';

// Navigation and Layout
import SiteNavigation from './components/Navigation/SiteNavigation';

// Pages
import WelcomePage from './pages/WelcomePage';
import ProjectSetupPage from './pages/ProjectSetupPage';
import ContentTypePage from './pages/ContentTypePage';
import ContentDetailsPage from './pages/ContentDetailsPage';
import AdvancedOptionsPage from './pages/AdvancedOptionsPage';
import ProcessingPage from './pages/ProcessingPage';
import ContentPreviewPage from './pages/ContentPreviewPage';
import DeliveryOptionsPage from './pages/DeliveryOptionsPage';
import SuccessPage from './pages/SuccessPage';
import DashboardPage from './pages/DashboardPage';

// LLM Content Features
import LlmContentGenerator from './components/LlmContentGenerator/LlmContentGenerator';
import LlmContentAnalyzer from './components/LlmContentAnalyzer/LlmContentAnalyzer';

// Competition X Features
import CompetitionXDashboard from './components/CompetitionX/CompetitionXDashboard';
import CompetitorAnalysis from './components/CompetitionX/CompetitorAnalysis';
import RealTimeMonitoring from './components/CompetitionX/RealTimeMonitoring';

// Product X Features
import ProductXDashboard from './components/ProductX/ProductXDashboard';
import MarketResearchDashboard from './components/ProductX/MarketResearchDashboard';
import CompetitiveIntelligenceDashboard from './components/ProductX/CompetitiveIntelligenceDashboard';
import TrendAnalysisDashboard from './components/ProductX/TrendAnalysisDashboard';
import UserProfileDashboard from './components/ProductX/UserProfileDashboard';
import AudienceExpansionDashboard from './components/ProductX/AudienceExpansionDashboard';
import MediaIntelligenceDashboard from './components/ProductX/MediaIntelligenceDashboard';
import StrategicRecommendationsDashboard from './components/ProductX/StrategicRecommendationsDashboard';

// API Integration Features
import { MentionlyticsDashboard } from './components/Mentionlytics';
import { MozSeoDashboard } from './components/MozSeo';
import { ProductIntelligenceDashboard } from './components/RapidApi';



// QueryProvider is now imported from './context/QueryProvider'

// Layout component that includes navigation
const AppLayout: React.FC = () => {
  return (
    <div className="flex">
      <SiteNavigation />
      <main className="flex-grow p-4 md:p-6 mt-16">
        <Outlet />
        <Toaster position="top-right" toastOptions={{
          duration: 5000,
          style: {
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }} />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AzureServiceProvider>
        <Router>
          <Routes>
            {/* Public routes without the navigation sidebar */}
            <Route path="/" element={<WelcomePage />} />
            
            {/* Routes with navigation sidebar */}
            <Route path="/" element={<AppLayout />}>
              <Route path="project-setup" element={<ProjectSetupPage />} />
              <Route path="content-type" element={<ContentTypePage />} />
              <Route path="content-details" element={<ContentDetailsPage />} />
              <Route path="advanced-options" element={<AdvancedOptionsPage />} />
              <Route path="processing" element={<ProcessingPage />} />
              <Route path="preview" element={<ContentPreviewPage />} />
              <Route path="delivery" element={<DeliveryOptionsPage />} />
              <Route path="success" element={<SuccessPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* LLM Content Feature Routes */}
              <Route path="llm-content">
                <Route index element={<Navigate to="/llm-content/generate" replace />} />
                <Route path="generate" element={<LlmContentGenerator />} />
                <Route path="analyze" element={<LlmContentAnalyzer />} />
              </Route>

              {/* Competition X Feature Routes */}
              <Route path="competition-x">
                <Route index element={<CompetitionXDashboard />} />
                <Route path="analysis" element={<CompetitorAnalysis />} />
                <Route path="intelligence" element={<CompetitorAnalysis />} />
                <Route path="monitoring" element={<RealTimeMonitoring />} />
              </Route>

              {/* Product X - Sleep Company Feature Routes */}
              <Route path="product-x">
                <Route index element={<ProductXDashboard />} />
                <Route path="dashboard" element={<ProductXDashboard />} />
                <Route path="market-research" element={<MarketResearchDashboard />} />
                <Route path="competitive-intelligence" element={<CompetitiveIntelligenceDashboard />} />
                <Route path="trend-analysis" element={<TrendAnalysisDashboard />} />
                <Route path="user-profiles" element={<UserProfileDashboard />} />
                <Route path="audience-expansion" element={<AudienceExpansionDashboard />} />
                <Route path="media-intelligence" element={<MediaIntelligenceDashboard />} />
                <Route path="strategic-recommendations" element={<StrategicRecommendationsDashboard />} />
              </Route>

              {/* API Integration Feature Routes */}
              <Route path="social-listening">
                <Route index element={<MentionlyticsDashboard />} />
                <Route path="mentionlytics" element={<MentionlyticsDashboard />} />
              </Route>

              <Route path="seo-optimizer">
                <Route index element={<MozSeoDashboard />} />
                <Route path="moz" element={<MozSeoDashboard />} />
              </Route>

              <Route path="product-intelligence">
                <Route index element={<ProductIntelligenceDashboard />} />
                <Route path="rapid-api" element={<ProductIntelligenceDashboard />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AzureServiceProvider>
    </QueryProvider>
  );
}

export default App;
