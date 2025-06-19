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
import LlmContentRoutes from './routes/LlmContentRoutes';
import LlmContentGenerator from './components/LlmContentGenerator/LlmContentGenerator';
import LlmContentAnalyzer from './components/LlmContentAnalyzer/LlmContentAnalyzer';



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
            </Route>
          </Routes>
        </Router>
      </AzureServiceProvider>
    </QueryProvider>
  );
}

export default App;
