import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
// Import types from our types directory
import { ApiResponse, LLMContentInput, LLMContentOutput } from '../../types/llmContent';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  FormControl, 
  FormHelperText, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography,
  Chip,
  Paper,
  Divider,
  Alert
} from '@mui/material';
// Import services
import { llmContentService } from '../../services';

const contentTypeOptions = [
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'technical_guide', label: 'Technical Guide' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'product_review', label: 'Product Review' },
  { value: 'industry_analysis', label: 'Industry Analysis' },
  { value: 'social_media', label: 'Social Media Content' }
];

const audienceOptions = [
  { value: 'b2b', label: 'Business (B2B)' },
  { value: 'b2c', label: 'Consumer (B2C)' }
];

const toneOptions = [
  { value: 'formal', label: 'Formal' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'technical', label: 'Technical' },
  { value: 'friendly', label: 'Friendly' }
];

const lengthOptions = [
  { value: 'short', label: 'Short (Brief Overview)' },
  { value: 'medium', label: 'Medium (Standard Length)' },
  { value: 'long', label: 'Long (Detailed Content)' }
];

const llmTargetOptions = [
  { value: 'general', label: 'General (All LLMs)' },
  { value: 'gpt4', label: 'GPT-4' },
  { value: 'claude', label: 'Claude' },
  { value: 'palm', label: 'PaLM/Gemini' }
];

export const LlmContentGenerator: React.FC = () => {
  console.log('LlmContentGenerator rendering');
  const { register, handleSubmit, control, formState: { errors } } = useForm<LLMContentInput>();
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [keyPointInput, setKeyPointInput] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<LLMContentOutput | null>(null);

  const generateMutation = useMutation({
    mutationFn: (data: LLMContentInput) => {
      console.log('Sending content generation request to API:', data);
      return llmContentService.generateContent(data);
    },
    onSuccess: (response: ApiResponse<LLMContentOutput>) => {
      console.log('API Response from Claude:', response);
      if (response.data) {
        console.log('Generated content:', response.data);
        setGeneratedContent(response.data);
      }
    },
    onError: (error) => {
      console.error('Error from Claude API:', error);
    }
  });

  const onSubmit = (data: LLMContentInput) => {
    const payload: LLMContentInput = {
      ...data,
      keyPoints,
      searchKeywords: keywords
    };
    generateMutation.mutate(payload);
  };

  const addKeyPoint = () => {
    if (keyPointInput && !keyPoints.includes(keyPointInput)) {
      setKeyPoints([...keyPoints, keyPointInput]);
      setKeyPointInput('');
    }
  };

  const removeKeyPoint = (point: string) => {
    setKeyPoints(keyPoints.filter(p => p !== point));
  };

  const addKeyword = () => {
    if (keywordInput && !keywords.includes(keywordInput)) {
      setKeywords([...keywords, keywordInput]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        LLM-Optimized Content Generator
      </Typography>
      <Typography variant="body1" gutterBottom color="text.secondary">
        Generate content specifically optimized for LLM processing and comprehension.
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3, mt: 1 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate New Content
              </Typography>
              <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  label="Topic"
                  fullWidth
                  margin="normal"
                  {...register('topic', { required: 'Topic is required' })}
                  error={!!errors.topic}
                  helperText={errors.topic?.message}
                />
                
                <FormControl fullWidth margin="normal" error={!!errors.contentType}>
                  <InputLabel>Content Type</InputLabel>
                  <Controller
                    name="contentType"
                    control={control}
                    defaultValue="blog_post"
                    rules={{ required: 'Content type is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Content Type">
                        {contentTypeOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.contentType && (
                    <FormHelperText>{errors.contentType.message}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl fullWidth margin="normal" error={!!errors.audience}>
                  <InputLabel>Target Audience</InputLabel>
                  <Controller
                    name="audience"
                    control={control}
                    defaultValue="b2b"
                    rules={{ required: 'Target audience is required' }}
                    render={({ field }) => (
                      <Select {...field} label="Target Audience">
                        {audienceOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.audience && (
                    <FormHelperText>{errors.audience.message}</FormHelperText>
                  )}
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tone of Voice</InputLabel>
                  <Controller
                    name="toneOfVoice"
                    control={control}
                    defaultValue="conversational"
                    render={({ field }) => (
                      <Select {...field} label="Tone of Voice">
                        {toneOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Target Length</InputLabel>
                  <Controller
                    name="targetLength"
                    control={control}
                    defaultValue="medium"
                    render={({ field }) => (
                      <Select {...field} label="Target Length">
                        {lengthOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Target LLM</InputLabel>
                  <Controller
                    name="llmTarget"
                    control={control}
                    defaultValue="general"
                    render={({ field }) => (
                      <Select {...field} label="Target LLM">
                        {llmTargetOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    Optimize content structure for specific LLM processing
                  </FormHelperText>
                </FormControl>
                
                <TextField
                  label="Purpose"
                  fullWidth
                  margin="normal"
                  placeholder="e.g., Educate customers about our new product features"
                  {...register('purpose')}
                />
                
                {/* Key Points */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Key Points</Typography>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add a key point to include"
                      value={keyPointInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyPointInput(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addKeyPoint()}
                    />
                    <Button 
                      onClick={addKeyPoint} 
                      variant="contained" 
                      sx={{ ml: 1 }}
                      disabled={!keyPointInput}
                    >
                      Add
                    </Button>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1, minHeight: '60px' }}>
                    {keyPoints.length > 0 ? (
                      keyPoints.map((point, index) => (
                        <Chip
                          key={index}
                          label={point}
                          onDelete={() => removeKeyPoint(point)}
                          sx={{ m: 0.5 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                        No key points added. Key points help guide content generation.
                      </Typography>
                    )}
                  </Paper>
                </Box>
                
                {/* Keywords */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Search Keywords</Typography>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add a search keyword"
                      value={keywordInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeywordInput(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button 
                      onClick={addKeyword} 
                      variant="contained" 
                      sx={{ ml: 1 }}
                      disabled={!keywordInput}
                    >
                      Add
                    </Button>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1, minHeight: '60px' }}>
                    {keywords.length > 0 ? (
                      keywords.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={keyword}
                          onDelete={() => removeKeyword(keyword)}
                          sx={{ m: 0.5 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                        No keywords added. Keywords help optimize for search.
                      </Typography>
                    )}
                  </Paper>
                </Box>
                
                <Box sx={{ mt: 3, textAlign: 'right' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={generateMutation.isPending}
                    startIcon={generateMutation.isPending ? <CircularProgress size={20} /> : null}
                  >
                    {generateMutation.isPending ? 'Generating...' : 'Generate Content'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card sx={{ minHeight: '600px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Content
              </Typography>
              
              {generateMutation.isPending && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {generateMutation.isError && (
                <Alert severity="error" sx={{ my: 2 }}>
                  Failed to generate content. Please try again.
                </Alert>
              )}
              
              {generatedContent && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {generatedContent.title}
                  </Typography>
                  
                  <Box sx={{ my: 2, backgroundColor: 'background.paper', p: 2, borderRadius: 1 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Summary:</strong> {generatedContent.summary}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {generatedContent.sections.map((section, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        {section.title}
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {section.content}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Content Metadata
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Chip label={`Type: ${generatedContent.contentType}`} variant="outlined" />
                    <Chip label={`Audience: ${generatedContent.audience}`} variant="outlined" />
                    <Chip label={`Tone: ${generatedContent.toneOfVoice}`} variant="outlined" />
                    <Chip label={`Optimized for: ${generatedContent.metadata.optimizedFor}`} variant="outlined" />
                    <Chip label={`Quality Score: ${generatedContent.metadata.llmQualityScore}`} variant="outlined" />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default LlmContentGenerator;
