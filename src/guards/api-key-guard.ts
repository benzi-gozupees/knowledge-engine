import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly validApiKey = process.env.x_api_key || 'default-secret';

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey || apiKey !== this.validApiKey) {
            throw new UnauthorizedException('Invalid or missing API key');
        }

        return true;
    }
}
