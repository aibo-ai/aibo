import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import { llmContentService } from '../../services';
import { ApiResponse, LLMContentAnalysisResult, ChunkingResult } from '../../types/llmContent';

const llmTargetOptions = [
  { value: 'general', label: 'General (All LLMs)' },
  { value: 'gpt4', label: 'GPT-4' },
  { value: 'claude', label: 'Claude' },
  { value: 'palm', label: 'PaLM/Gemini' }
];

const chunkTypeOptions = [
  { value: 'semantic', label: 'Semantic Chunking' },
  { value: 'fixed', label: 'Fixed Length Chunking' },
  { value: 'hybrid', label: 'Hybrid Chunking' }
];

export const LlmContentAnalyzer: React.FC = () => {
  const [content, setContent] = useState('');
  const [targetLLM, setTargetLLM] = useState('general');
  const [chunkType, setChunkType] = useState<'semantic' | 'fixed' | 'hybrid'>('semantic');
  const [targetTokenSize, setTargetTokenSize] = useState(500);
  const [analysisResult, setAnalysisResult] = useState<LLMContentAnalysisResult | null>(null);
  const [chunkingResult, setChunkingResult] = useState<ChunkingResult | null>(null);
  
  const analyzeMutation = useMutation({
    mutationFn: (data: { content: string; targetLLM?: string }) => {
      console.log('Sending content analysis request to API:', data);
      return llmContentService.analyzeContent(data);
    },
    onSuccess: (response: ApiResponse<LLMContentAnalysisResult>) => {
      console.log('API Response from content analysis:', response);
      if (response.data) {
        console.log('Analysis result:', response.data);
        setAnalysisResult(response.data);
      } else if (response.error) {
        console.error('Error in analysis response:', response.error);
      }
    },
    onError: (error) => {
      console.error('Error from analysis API:', error);
    }
  });

  const chunkMutation = useMutation({
    mutationFn: (data: { content: string; chunkType?: 'semantic' | 'fixed' | 'hybrid'; targetTokenSize?: number }) => {
      console.log('Sending content chunking request to API:', data);
      return llmContentService.chunkContent(data);
    },
    onSuccess: (response: ApiResponse<ChunkingResult>) => {
      console.log('API Response from content chunking:', response);
      if (response.data) {
        console.log('Chunking result:', response.data);
        setChunkingResult(response.data);
      } else if (response.error) {
        console.error('Error in chunking response:', response.error);
      }
    },
    onError: (error) => {
      console.error('Error from chunking API:', error);
    }
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate({ 
      content, 
      targetLLM 
    });
  };

  const handleChunk = () => {
    chunkMutation.mutate({
      content,
      chunkType,
      targetTokenSize
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        LLM Content Analyzer
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analyze Content for LLM Processing
              </Typography>
              
              <TextField
                label="Content to analyze"
                multiline
                rows={10}
                fullWidth
                margin="normal"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the content you want to analyze..."
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Target LLM</InputLabel>
                <Select
                  value={targetLLM}
                  label="Target LLM"
                  onChange={(e) => setTargetLLM(e.target.value)}
                >
                  {llmTargetOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>
                  <Typography variant="subtitle2" gutterBottom>Chunking Options</Typography>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Chunking Method</InputLabel>
                    <Select
                      value={chunkType}
                      label="Chunking Method"
                      onChange={(e) => setChunkType(e.target.value as 'semantic' | 'fixed' | 'hybrid')}
                    >
                      {chunkTypeOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Target Token Size"
                    type="number"
                    fullWidth
                    margin="dense"
                    value={targetTokenSize}
                    onChange={(e) => setTargetTokenSize(Number(e.target.value))}
                    inputProps={{ min: 100, max: 2000 }}
                  />
                </div>
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!content || analyzeMutation.isPending}
                  startIcon={analyzeMutation.isPending ? <CircularProgress size={20} /> : null}
                >
                  {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Content'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleChunk}
                  disabled={!content || chunkMutation.isPending}
                  startIcon={chunkMutation.isPending ? <CircularProgress size={20} /> : null}
                >
                  {chunkMutation.isPending ? 'Processing...' : 'Process Chunking'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              
              {analyzeMutation.isPending && (
                <Box sx={{ width: '100%', my: 4 }}>
                  <LinearProgress />
                </Box>
              )}
              
              {analyzeMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to analyze content. Please try again.
                </Alert>
              )}
              
              {analysisResult && (
                <Box>
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle1">Content Analysis Summary</Typography>
                    <Typography variant="body2">
                      Analyzed {analysisResult.contentLength} characters, 
                      approximately {Math.round(analysisResult.contentLength / 4)} tokens.
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="caption">LLM Readability Score</Typography>
                      <Typography variant="h5">{analysisResult.metrics.readabilityScore}/100</Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="caption">LLM Quality Score</Typography>
                      <Typography variant="h5">{analysisResult.metrics.llmQualityScore}/10</Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="caption">Semantic Density</Typography>
                      <Typography variant="h5">{analysisResult.metrics.semanticDensity}/100</Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="caption">Contextual Relevance</Typography>
                      <Typography variant="h5">{analysisResult.metrics.contextualRelevance}/100</Typography>
                    </Paper>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Optimization Suggestions
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    {analysisResult.recommendations.map((recommendation: string, index: number) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">{recommendation}</Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Analysis ID: {analysisResult.analysisId} | Generated: {new Date(analysisResult.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {!analysisResult && !analyzeMutation.isPending && (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No analysis data available. Click "Analyze Content" to begin.
                </Typography>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Chunking Results
              </Typography>
              
              {chunkMutation.isPending && (
                <Box sx={{ width: '100%', my: 4 }}>
                  <LinearProgress />
                </Box>
              )}
              
              {chunkMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to process chunking. Please try again.
                </Alert>
              )}
              
              {chunkingResult && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                      <Box>
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="caption">Total Chunks</Typography>
                          <Typography variant="h5">{chunkingResult.metrics.chunkCount}</Typography>
                        </Paper>
                      </Box>
                      
                      <Box>
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="caption">Avg. Chunk Size</Typography>
                          <Typography variant="h5">{Math.round(chunkingResult.metrics.averageChunkSize)} chars</Typography>
                        </Paper>
                      </Box>
                      
                      <Box>
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="caption">Token Reduction</Typography>
                          <Typography variant="h5">{chunkingResult.metrics.tokenReductionPercentage.toFixed(1)}%</Typography>
                        </Paper>
                      </Box>
                      
                      <Box>
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="caption">Context Preservation</Typography>
                          <Typography variant="h5">{chunkingResult.metrics.contextPreservationScore}/100</Typography>
                        </Paper>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Chunk Preview ({chunkingResult.chunks.length} chunks)
                  </Typography>
                  
                  <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                    {chunkingResult.chunks.map((chunk, index: number) => (
                      <Paper 
                        key={index} 
                        elevation={0} 
                        variant="outlined" 
                        sx={{ 
                          p: 1.5, 
                          mb: 1.5, 
                          bgcolor: 'background.paper',
                          position: 'relative'
                        }}
                      >
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 5, 
                          right: 5, 
                          bgcolor: 'primary.main', 
                          color: 'primary.contrastText',
                          px: 1,
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}>
                          #{index + 1}
                        </Box>
                        <Typography variant="body2" component="pre" sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'monospace',
                          mt: 1 
                        }}>
                          {chunk.content}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Chunking ID: {chunkingResult.chunkingId} | Generated: {new Date(chunkingResult.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              )}
              
              {!chunkingResult && !chunkMutation.isPending && (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No chunking data available. Click "Process Chunking" to begin.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default LlmContentAnalyzer;
