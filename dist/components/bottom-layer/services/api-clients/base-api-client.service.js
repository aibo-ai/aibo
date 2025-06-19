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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseApiClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let BaseApiClient = class BaseApiClient {
    constructor(baseUrl, apiKey, config = {}) {
        this.logger = new common_1.Logger(this.constructor.name);
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.client = axios_1.default.create(Object.assign({ baseURL: baseUrl, timeout: 30000 }, config));
        this.client.interceptors.request.use((config) => {
            var _a;
            this.logger.debug(`API Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        });
        this.client.interceptors.response.use((response) => {
            this.logger.debug(`API Response: ${response.status} ${response.statusText}`);
            return response;
        }, (error) => {
            if (error.response) {
                this.logger.error(`API Error: ${error.response.status} ${error.response.statusText}`);
                this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
            }
            else if (error.request) {
                this.logger.error('API Error: No response received');
            }
            else {
                this.logger.error(`API Error: ${error.message}`);
            }
            return Promise.reject(error);
        });
    }
    async get(url, params, config) {
        try {
            const response = await this.client.get(url, Object.assign({ params }, config));
            return response.data;
        }
        catch (error) {
            this.logger.error(`GET request failed: ${url}`);
            throw error;
        }
    }
    async post(url, data, config) {
        try {
            const response = await this.client.post(url, data, config);
            return response.data;
        }
        catch (error) {
            this.logger.error(`POST request failed: ${url}`);
            throw error;
        }
    }
};
exports.BaseApiClient = BaseApiClient;
exports.BaseApiClient = BaseApiClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String, String, Object])
], BaseApiClient);
//# sourceMappingURL=base-api-client.service.js.map