import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ElevenLabsVoiceRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  output_format?: 'mp3_22050_32' | 'mp3_44100_32' | 'mp3_44100_64' | 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
}

export interface ContentAudioRequest {
  content: string;
  contentType: string;
  audience: string;
  voiceProfile?: 'professional' | 'conversational' | 'authoritative' | 'friendly' | 'narrative';
  speed?: 'slow' | 'normal' | 'fast';
  outputFormat?: 'mp3_22050_32' | 'mp3_44100_32' | 'mp3_44100_64' | 'mp3_44100_128';
}

export interface GeneratedAudio {
  id: string;
  audioUrl: string;
  audioPath: string;
  text: string;
  voiceId: string;
  duration?: number;
  metadata: {
    contentType: string;
    audience: string;
    voiceProfile: string;
    speed: string;
    outputFormat: string;
    generatedAt: string;
    fileSize?: number;
  };
}

@Injectable()
export class ElevenLabsTTSService {
  private readonly logger = new Logger(ElevenLabsTTSService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly audioOutputDir: string;

  // Pre-configured voice IDs for different profiles
  private readonly voiceProfiles = {
    professional: 'EXAVITQu4vr4xnSDxMaL', // Bella - Professional female voice
    conversational: 'ErXwobaYiN019PkySvjV', // Antoni - Conversational male voice
    authoritative: 'VR6AewLTigWG4xSOukaG', // Arnold - Authoritative male voice
    friendly: 'AZnzlk1XvdvUeBnXmlld', // Domi - Friendly female voice
    narrative: 'pNInz6obpgDQGcFmaJgB', // Adam - Narrative male voice
  };

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    this.apiUrl = this.configService.get<string>('ELEVENLABS_API_URL') || 'https://api.elevenlabs.io/v1/text-to-speech/';
    this.audioOutputDir = path.join(process.cwd(), 'generated-audio');

    if (!this.apiKey) {
      this.logger.warn('Eleven Labs API key not configured. Text-to-speech will be disabled.');
    }

    // Ensure audio output directory exists
    this.ensureAudioDirectory();
  }

  /**
   * Convert content to speech using Eleven Labs
   */
  async generateContentAudio(request: ContentAudioRequest): Promise<GeneratedAudio> {
    if (!this.apiKey) {
      throw new Error('Eleven Labs API key not configured');
    }

    try {
      this.logger.log(`Generating audio for ${request.contentType} content`);

      // Select appropriate voice based on profile
      const voiceId = this.getVoiceForProfile(request.voiceProfile || 'professional');
      
      // Prepare content for speech synthesis
      const processedText = this.preprocessTextForSpeech(request.content);
      
      // Configure voice settings based on audience and speed
      const voiceSettings = this.getVoiceSettings(request);

      // Generate audio using Eleven Labs
      const elevenLabsRequest: ElevenLabsVoiceRequest = {
        text: processedText,
        voice_id: voiceId,
        model_id: 'eleven_multilingual_v2',
        voice_settings: voiceSettings,
        output_format: request.outputFormat || 'mp3_44100_128'
      };

      const audioBuffer = await this.synthesizeSpeech(voiceId, elevenLabsRequest);
      
      // Save audio file
      const audioFile = await this.saveAudioFile(audioBuffer, request);
      
      return {
        id: `elevenlabs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        audioUrl: `/api/audio/${audioFile.filename}`,
        audioPath: audioFile.path,
        text: processedText,
        voiceId: voiceId,
        metadata: {
          contentType: request.contentType,
          audience: request.audience,
          voiceProfile: request.voiceProfile || 'professional',
          speed: request.speed || 'normal',
          outputFormat: request.outputFormat || 'mp3_44100_128',
          generatedAt: new Date().toISOString(),
          fileSize: audioFile.size
        }
      };

    } catch (error) {
      this.logger.error(`Failed to generate content audio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Synthesize speech using Eleven Labs API
   */
  async synthesizeSpeech(voiceId: string, request: ElevenLabsVoiceRequest): Promise<Buffer> {
    try {
      const url = `${this.apiUrl}${voiceId}`;
      
      const response = await axios.post(
        url,
        {
          text: request.text,
          model_id: request.model_id,
          voice_settings: request.voice_settings
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer',
          timeout: 120000 // 2 minute timeout for audio generation
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      if (error.response) {
        this.logger.error(`Eleven Labs API error: ${error.response.status} - ${error.response.statusText}`);
        throw new Error(`Eleven Labs API error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        this.logger.error('Eleven Labs API request timeout or network error');
        throw new Error('Eleven Labs API request failed - network error');
      } else {
        this.logger.error(`Eleven Labs request setup error: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Get voice ID for specified profile
   */
  private getVoiceForProfile(profile: string): string {
    return this.voiceProfiles[profile] || this.voiceProfiles.professional;
  }

  /**
   * Get voice settings based on request parameters
   */
  private getVoiceSettings(request: ContentAudioRequest) {
    const baseSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    };

    // Adjust settings based on audience
    if (request.audience === 'b2b') {
      baseSettings.stability = 0.7; // More stable for professional content
      baseSettings.style = 0.1; // Slightly more formal
    } else if (request.audience === 'b2c') {
      baseSettings.stability = 0.4; // More expressive for consumer content
      baseSettings.style = 0.3; // More conversational
    }

    // Adjust for content type
    if (request.contentType === 'whitepaper' || request.contentType === 'report') {
      baseSettings.stability = 0.8; // Very stable for formal documents
      baseSettings.style = 0.0; // Neutral style
    } else if (request.contentType === 'blog_post' || request.contentType === 'social_media') {
      baseSettings.stability = 0.3; // More expressive for casual content
      baseSettings.style = 0.4; // More conversational
    }

    return baseSettings;
  }

  /**
   * Preprocess text for better speech synthesis
   */
  private preprocessTextForSpeech(text: string): string {
    // Remove markdown formatting
    let processedText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code formatting
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .replace(/\n/g, '. ') // Convert line breaks to pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Add natural pauses for better speech flow
    processedText = processedText
      .replace(/([.!?])\s+/g, '$1 ') // Ensure space after punctuation
      .replace(/([,;:])\s*/g, '$1 ') // Add space after commas, semicolons, colons
      .replace(/\s+([.!?])/g, '$1'); // Remove space before punctuation

    // Limit text length for API constraints (Eleven Labs has character limits)
    if (processedText.length > 5000) {
      processedText = processedText.substring(0, 4950) + '...';
      this.logger.warn('Text truncated to fit Eleven Labs character limit');
    }

    return processedText;
  }

  /**
   * Save audio file to disk
   */
  private async saveAudioFile(audioBuffer: Buffer, request: ContentAudioRequest): Promise<{ path: string; filename: string; size: number }> {
    const timestamp = Date.now();
    const filename = `content_audio_${timestamp}.mp3`;
    const filePath = path.join(this.audioOutputDir, filename);

    await fs.promises.writeFile(filePath, audioBuffer);
    
    const stats = await fs.promises.stat(filePath);
    
    return {
      path: filePath,
      filename: filename,
      size: stats.size
    };
  }

  /**
   * Ensure audio output directory exists
   */
  private ensureAudioDirectory(): void {
    if (!fs.existsSync(this.audioOutputDir)) {
      fs.mkdirSync(this.audioOutputDir, { recursive: true });
      this.logger.log(`Created audio output directory: ${this.audioOutputDir}`);
    }
  }

  /**
   * Get available voices from Eleven Labs
   */
  async getAvailableVoices(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('Eleven Labs API key not configured');
    }

    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data.voices;
    } catch (error) {
      this.logger.error(`Failed to fetch available voices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Eleven Labs service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; configured: boolean; voiceProfiles: string[] } {
    return {
      available: this.isAvailable(),
      configured: !!this.apiKey,
      voiceProfiles: Object.keys(this.voiceProfiles)
    };
  }
}
