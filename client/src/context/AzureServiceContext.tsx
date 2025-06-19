import React, { createContext, useContext, useState, useEffect } from 'react';
import AzureServices from '../services/azureServices';
import { useAzureContentGeneration, useContentWorkflow } from '../hooks/useAzureQueries';

// Define the context type
interface AzureServiceContextType {
  isEnabled: boolean;
  isLoading: boolean;
  error: Error | null;
  services: typeof AzureServices;
  contentGeneration: ReturnType<typeof useAzureContentGeneration>;
  contentWorkflow: ReturnType<typeof useContentWorkflow>;
}

// Create the context with default values
const AzureServiceContext = createContext<AzureServiceContextType>({
  isEnabled: false,
  isLoading: false,
  error: null,
  services: AzureServices,
  contentGeneration: {} as ReturnType<typeof useAzureContentGeneration>,
  contentWorkflow: {} as ReturnType<typeof useContentWorkflow>,
});

// Provider component
export const AzureServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const contentGeneration = useAzureContentGeneration();
  const contentWorkflow = useContentWorkflow();
  
  // Check if Azure services should be enabled
  useEffect(() => {
    try {
      // Read from environment variable
      const useAzureServices = process.env.REACT_APP_USE_AZURE_SERVICES === 'true';
      setIsEnabled(useAzureServices);
      
      // Check for required configuration
      if (useAzureServices) {
        if (!process.env.REACT_APP_AZURE_FUNCTIONS_ENDPOINT) {
          console.warn('Azure Functions endpoint not configured. Some features may not work correctly.');
        }
        
        if (!process.env.REACT_APP_AZURE_LOGIC_APP_ENDPOINT) {
          console.warn('Azure Logic App endpoint not configured. Workflow orchestration may not work correctly.');
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error initializing Azure services'));
      setIsLoading(false);
    }
  }, []);
  
  return (
    <AzureServiceContext.Provider
      value={{
        isEnabled,
        isLoading,
        error,
        services: AzureServices,
        contentGeneration,
        contentWorkflow,
      }}
    >
      {children}
    </AzureServiceContext.Provider>
  );
};

// Custom hook to use the Azure service context
export const useAzureService = () => useContext(AzureServiceContext);

export default AzureServiceContext;
