"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const technical_seo_validator_service_1 = require("../technical-seo-validator.service");
const semantic_html_analyzer_service_1 = require("../semantic-html-analyzer.service");
const accessibility_validator_service_1 = require("../accessibility-validator.service");
const seo_validator_interfaces_1 = require("../../../../common/interfaces/seo-validator.interfaces");
describe('TechnicalSeoValidatorService', () => {
    let service;
    let semanticAnalyzer;
    let accessibilityValidator;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),
            ],
            providers: [
                technical_seo_validator_service_1.TechnicalSeoValidatorService,
                semantic_html_analyzer_service_1.SemanticHtmlAnalyzerService,
                accessibility_validator_service_1.AccessibilityValidatorService,
            ],
        }).compile();
        service = module.get(technical_seo_validator_service_1.TechnicalSeoValidatorService);
        semanticAnalyzer = module.get(semantic_html_analyzer_service_1.SemanticHtmlAnalyzerService);
        accessibilityValidator = module.get(accessibility_validator_service_1.AccessibilityValidatorService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('validateContent', () => {
        it('should throw an error if neither URL nor HTML content is provided', async () => {
            await expect(service.validateContent({})).rejects.toThrow('Either URL or HTML content must be provided for validation');
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
                    category: seo_validator_interfaces_1.SeoValidationCategory.IMAGES,
                    severity: seo_validator_interfaces_1.SeoValidationSeverity.ERROR,
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
//# sourceMappingURL=technical-seo-validator.service.spec.js.map