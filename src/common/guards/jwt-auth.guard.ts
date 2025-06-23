import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // For development, we'll use a simple token validation
      // In production, you would validate JWT tokens properly
      const validTokens = this.configService.get<string>('VALID_TOKENS', 'dev-token,admin-token').split(',');
      
      if (!validTokens.includes(token)) {
        throw new UnauthorizedException('Invalid token');
      }

      // Add user info to request
      request['user'] = {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['user']
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
