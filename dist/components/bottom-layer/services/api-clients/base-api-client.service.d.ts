import { Logger } from '@nestjs/common';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
export declare class BaseApiClient {
    protected readonly logger: Logger;
    protected readonly client: AxiosInstance;
    protected baseUrl: string;
    protected apiKey: string;
    constructor(baseUrl: string, apiKey: string, config?: AxiosRequestConfig);
    protected get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T>;
    protected post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
}
