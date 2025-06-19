"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const orchestrator_module_1 = require("./components/orchestrator/orchestrator.module");
const bottom_layer_module_1 = require("./components/bottom-layer/bottom-layer.module");
const middle_layer_module_1 = require("./components/middle-layer/middle-layer.module");
const top_layer_module_1 = require("./components/top-layer/top-layer.module");
const shared_module_1 = require("./shared/shared.module");
const common_module_1 = require("./common/common.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
            }),
            shared_module_1.SharedModule,
            common_module_1.CommonModule,
            orchestrator_module_1.OrchestratorModule,
            bottom_layer_module_1.BottomLayerModule,
            middle_layer_module_1.MiddleLayerModule,
            top_layer_module_1.TopLayerModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map