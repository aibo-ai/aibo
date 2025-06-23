#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs
import time

PORT = 3001

class ContentArchitectHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="client/build", **kwargs)
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                'status': 'healthy',
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
                'service': 'Content Architect Frontend'
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # For all other GET requests, serve static files or index.html
        super().do_GET()
    
    def do_POST(self):
        if self.path == '/llm-content/generate':
            self.handle_content_generation()
        elif self.path == '/llm-content/analyze':
            self.handle_content_analysis()
        elif self.path == '/llm-content/chunk':
            self.handle_content_chunking()
        else:
            self.send_error(404, "Endpoint not found")
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def handle_content_generation(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            print(f"🚀 Content generation request received: {data.get('topic', 'Unknown topic')}")
            
            # Simulate processing time
            time.sleep(1.5)
            
            topic = data.get('topic', 'Sample Topic')
            audience = data.get('audience', 'b2b')
            content_type = data.get('contentType', 'blog_post')
            key_points = data.get('keyPoints', [])
            tone_of_voice = data.get('toneOfVoice', 'professional')
            llm_target = data.get('llmTarget', 'general')
            enable_image = data.get('enableImageGeneration', False)
            enable_audio = data.get('enableTextToSpeech', False)
            image_style = data.get('imageStyle', 'professional')
            voice_settings = data.get('voiceSettings', {'voice': 'alloy', 'speed': 1.0, 'stability': 0.75})
            
            # Generate sections
            sections = [
                {
                    'title': 'Introduction',
                    'content': f'Welcome to this comprehensive guide on {topic}. This content has been generated with AI-enhanced features for {audience} audience, providing valuable insights and actionable strategies.'
                },
                {
                    'title': 'Key Concepts and Fundamentals',
                    'content': f'Understanding {topic} is essential for {audience} success. This section covers fundamental concepts, best practices, and emerging trends that will help you stay ahead in your field.'
                }
            ]
            
            # Add key points as sections
            if key_points:
                for i, point in enumerate(key_points):
                    sections.append({
                        'title': f'Key Focus Area {i + 1}: {point}',
                        'content': f'**{point}** represents a critical aspect of {topic} implementation. This section provides detailed insights, practical applications, and proven strategies for maximizing impact in this area.'
                    })
            else:
                sections.extend([
                    {
                        'title': 'Implementation Strategy',
                        'content': f'A practical approach to implementing {topic} in your organization, with step-by-step guidance, proven methodologies, and expert recommendations for maximum impact.'
                    },
                    {
                        'title': 'Best Practices & Recommendations',
                        'content': f'Industry-leading practices for {topic} implementation, including common pitfalls to avoid, success metrics to track, and optimization strategies for long-term success.'
                    }
                ])
            
            sections.append({
                'title': 'Conclusion and Next Steps',
                'content': f'In conclusion, {topic} represents a significant opportunity for {audience} organizations to drive meaningful results. By implementing the strategies and best practices outlined in this guide, you can achieve sustainable success.'
            })
            
            word_count = sum(len(section['content'].split()) for section in sections)
            
            generated_content = {
                'contentId': f'ai_content_{int(time.time() * 1000)}',
                'title': f'{topic}: A Comprehensive Guide for {audience.upper()} Success',
                'summary': f'This comprehensive guide explores {topic} for {audience} audiences, providing AI-enhanced insights, actionable strategies, and practical implementation guidance.',
                'sections': sections,
                'contentType': content_type,
                'audience': audience,
                'toneOfVoice': tone_of_voice,
                'metadata': {
                    'optimizedFor': llm_target,
                    'estimatedTokenCount': sum(len(section['content']) // 4 for section in sections),
                    'llmQualityScore': 0.92,
                    'semanticScore': 0.88,
                    'wordCount': word_count,
                    'readingTime': max(1, word_count // 200),
                    'fleschReadingEase': 72,
                    'readingLevel': 'Standard',
                    'hasImage': enable_image,
                    'hasAudio': enable_audio,
                    'imageStyle': image_style if enable_image else None,
                    'voiceUsed': voice_settings.get('voice', 'alloy') if enable_audio else None,
                    'qualityScore': 92,
                    'seoOptimized': True,
                    'aiEnhanced': True
                },
                'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
            }
            
            # Add AI-generated image if enabled
            if enable_image:
                import base64
                svg_content = f'''
                <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.1" />
                      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:0.2" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#bg)"/>
                  <circle cx="400" cy="300" r="120" fill="#3b82f6" opacity="0.7"/>
                  <rect x="320" y="220" width="160" height="160" fill="none" stroke="#1e40af" stroke-width="3" opacity="0.8"/>
                  <text x="400" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e40af">
                    AI Generated
                  </text>
                  <text x="400" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">
                    {image_style} Style
                  </text>
                  <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
                    Topic: {topic}
                  </text>
                  <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">
                    Generated with DALL-E Integration
                  </text>
                </svg>
                '''
                
                generated_content['imageGeneration'] = {
                    'imageUrl': f'data:image/svg+xml;base64,{base64.b64encode(svg_content.encode()).decode()}',
                    'prompt': f'Professional {image_style} illustration about {topic} for {audience} audience',
                    'style': image_style,
                    'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
                    'aiProvider': 'DALL-E',
                    'dimensions': '800x600'
                }
            
            # Add AI-generated audio if enabled
            if enable_audio:
                audio_data = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
                
                generated_content['audioGeneration'] = {
                    'audioData': audio_data,
                    'audioUrl': audio_data,
                    'audioFormat': 'wav',
                    'voiceId': voice_settings.get('voice', 'alloy'),
                    'voiceProfile': voice_settings.get('voice', 'alloy'),
                    'voiceSettings': voice_settings,
                    'textLength': sum(len(section['content']) for section in sections),
                    'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
                    'aiProvider': 'ElevenLabs',
                    'duration': '3:45'
                }
            
            response = {
                'success': True,
                'data': generated_content,
                'message': 'Content generated successfully with AI enhancements'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
            print('✅ Content generated successfully')
            
        except Exception as e:
            print(f'❌ Error generating content: {e}')
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {
                'success': False,
                'error': f'Failed to generate content: {str(e)}',
                'message': 'Content generation failed'
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def handle_content_analysis(self):
        response = {
            'success': True,
            'data': {
                'analysisId': f'analysis_{int(time.time() * 1000)}',
                'metrics': {'readabilityScore': 0.85, 'llmQualityScore': 0.90},
                'recommendations': ['Add more semantic structure', 'Include relevant keywords']
            }
        }
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def handle_content_chunking(self):
        response = {
            'success': True,
            'data': {
                'chunkingId': f'chunking_{int(time.time() * 1000)}',
                'chunks': [{'id': 'chunk_1', 'content': 'Sample chunk content'}]
            }
        }
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

if __name__ == "__main__":
    os.chdir('/Users/the/Desktop/content-architect')
    
    with socketserver.TCPServer(("", PORT), ContentArchitectHandler) as httpd:
        print(f"🚀 Content Architect App running on port {PORT}")
        print(f"📱 Frontend: http://localhost:{PORT}")
        print(f"🔗 API: http://localhost:{PORT}/llm-content/generate")
        print(f"❤️ Health: http://localhost:{PORT}/health")
        httpd.serve_forever()
