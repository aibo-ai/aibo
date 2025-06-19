"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TechnicalSeoValidatorController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalSeoValidatorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const technical_seo_validator_service_1 = require("../services/technical-seo-validator.service");
class ValidateSeoDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ValidateSeoDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ValidateSeoDto.prototype, "html", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ValidateSeoDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateMobileFriendliness", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateAccessibility", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateHeadingStructure", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateSemanticHtml", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateCrawlerAccessibility", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateStructuredData", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateMetaTags", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validatePerformance", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ValidateSeoDto.prototype, "validateContentQuality", void 0);
let TechnicalSeoValidatorController = TechnicalSeoValidatorController_1 = class TechnicalSeoValidatorController {
    constructor(seoValidator) {
        this.seoValidator = seoValidator;
        this.logger = new common_1.Logger(TechnicalSeoValidatorController_1.name);
    }
    async validateContent(validateSeoDto) {
        try {
            this.logger.log(`Validating content: ${validateSeoDto.url || 'HTML content'}`);
            if (!validateSeoDto.url && !validateSeoDto.html) {
                return {
                    data: null,
                    error: 'Either URL or HTML content must be provided'
                };
            }
            const result = await this.seoValidator.validateContent(validateSeoDto);
            return {
                data: result,
                error: null
            };
        }
        catch (error) {
            this.logger.error(`Error validating content: ${error.message}`, error.stack);
            return {
                data: null,
                error: `Failed to validate content: ${error.message}`
            };
        }
    }
};
exports.TechnicalSeoValidatorController = TechnicalSeoValidatorController;
__decorate([
    (0, common_1.Post)('validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate content for technical SEO requirements' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The content has been validated successfully',
        type: Object
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input parameters' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ValidateSeoDto]),
    __metadata("design:returntype", Promise)
], TechnicalSeoValidatorController.prototype, "validateContent", null);
exports.TechnicalSeoValidatorController = TechnicalSeoValidatorController = TechnicalSeoValidatorController_1 = __decorate([
    (0, swagger_1.ApiTags)('Technical SEO'),
    (0, common_1.Controller)('api/seo-validator'),
    __metadata("design:paramtypes", [technical_seo_validator_service_1.TechnicalSeoValidatorService])
], TechnicalSeoValidatorController);
//# sourceMappingURL=technical-seo-validator.controller.js.map