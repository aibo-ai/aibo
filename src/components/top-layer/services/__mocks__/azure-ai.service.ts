import { Injectable } from '@nestjs/common';

@Injectable()
export class AzureAIService {
  generateCompletion = jest.fn();
  search = jest.fn();
  generateEmbeddings = jest.fn();
  analyzeText = jest.fn();
}
