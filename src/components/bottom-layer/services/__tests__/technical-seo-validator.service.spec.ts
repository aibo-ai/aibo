import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TechnicalSeoValidatorService } from '../technical-seo-validator.service';
import { SemanticHtmlAnalyzerService } from '../semantic-html-analyzer.service';
import { AccessibilityValidatorService } from '../accessibility-validator.service';
import { SeoValidationCategory, SeoValidationSeverity } from '../../../../common/interfaces/seo-validator.interfaces';

describe('TechnicalSeoValidatorService', () => {
  let service: TechnicalSeoValidatorService;
  let semanticAnalyzer: SemanticHtmlAnalyzerService;
  let accessibilityValidator: AccessibilityValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [
        TechnicalSeoValidatorService,
        SemanticHtmlAnalyzerService,
        AccessibilityValidatorService,
      ],
    }).compile();

    service = module.get<TechnicalSeoValidatorService>(TechnicalSeoValidatorService);
    semanticAnalyzer = module.get<SemanticHtmlAnalyzerService>(SemanticHtmlAnalyzerService);
    accessibilityValidator = module.get<AccessibilityValidatorService>(AccessibilityValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateContent', () => {
    it('should throw an error if neither URL nor HTML content is provided', async () => {
      await expect(service.validateContent({})).rejects.toThrow(
        'Either URL or HTML content must be provided for validation'
      );
    });

    it('should validate HTML content', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="Test page for SEO validation">
        </head>
        <body>
          <h1>Main Heading</h1>
          <p>This is a test paragraph.</p>
          <img src="test.jpg">
          <div>
            <h2>Subheading</h2>
            <p>Another paragraph.</p>
          </div>
        </body>
        </html>
      `;

      jest.spyOn(semanticAnalyzer, 'analyzeHtml').mockResolvedValue([
        {
          id: 'test-id-1',
          category: SeoValidationCategory.IMAGES,
          severity: SeoValidationSeverity.ERROR,
          title: 'Image missing alt text',
          description: 'Images must have alt attributes',
          impact: 'Screen readers cannot interpret images without alt text',
          recommendation: 'Add alt text to all images',
          element: '<img src="test.jpg">'
        }
      ]);

      const result = await service.validateContent({
        html: mockHtml,
        contentType: 'article',
        validateSemanticHtml: true,
        validateAccessibility: true
      });

      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.score).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
