import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LlmContentGenerator from '../components/LlmContentGenerator/LlmContentGenerator';
import LlmContentAnalyzer from '../components/LlmContentAnalyzer/LlmContentAnalyzer';

const LlmContentRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="generate" element={<LlmContentGenerator />} />
      <Route path="analyze" element={<LlmContentAnalyzer />} />
    </Routes>
  );
};

export default LlmContentRoutes;
