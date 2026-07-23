import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, mergeMap } from 'rxjs';
import {
  AdminAuditService,
  AuditResource,
} from './admin-audit.service';

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminAuditInterceptor.name);

  constructor(private readonly auditService: AdminAuditService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: { userId: number; username: string; role: string };
      }
    >();
    if (
      !['POST', 'PATCH', 'DELETE'].includes(request.method) ||
      !request.user ||
      request.originalUrl.split('?')[0].endsWith('/qr')
    ) {
      return next.handle();
    }

    const initialResource = this.resolveResource(request);
    const before = initialResource
      ? await this.safeSnapshot(initialResource)
      : null;

    return next.handle().pipe(
      mergeMap(async (result) => {
        const resource = this.resolveResource(request, result);
        if (!resource) return result;
        const after = await this.safeSnapshot(resource);
        try {
          await this.auditService.record(
            {
              userId: request.user!.userId,
              username: request.user!.username,
              role: request.user!.role,
              ipAddress:
                request.ip || request.socket.remoteAddress || undefined,
              userAgent: request.get('user-agent'),
            },
            this.actionName(request),
            resource,
            before,
            after,
          );
        } catch (error) {
          this.logger.error('Unable to write the administrative audit log', error);
        }
        return result;
      }),
    );
  }

  private resolveResource(
    request: Request,
    result?: any,
  ): AuditResource | null {
    const path = request.originalUrl.split('?')[0].replace(/^\/api\/admin\/?/, '');
    const definitions: Array<[RegExp, AuditResource['type']]> = [
      [/^products(?:\/(\d+))?/, 'product'],
      [/^categories(?:\/(\d+))?/, 'category'],
      [/^ingredients(?:\/(\d+))?/, 'ingredient'],
      [/^allergens(?:\/(\d+))?/, 'allergen'],
      [/^users(?:\/(\d+))?/, 'user'],
      [/^tables(?:\/(\d+))?/, 'table'],
    ];
    if (path === 'best-sellers') return { type: 'best-sellers', id: 'home' };
    for (const [pattern, type] of definitions) {
      const match = path.match(pattern);
      if (match) {
        const id = match[1] || result?.id;
        return { type, id: id === undefined ? null : String(id) };
      }
    }
    return null;
  }

  private actionName(request: Request) {
    const path = request.originalUrl.split('?')[0];
    if (path.endsWith('/open-session')) return 'table.session-open';
    if (path.endsWith('/close-session')) return 'table.session-close';
    if (path.endsWith('/regenerate-token')) return 'table.token-regenerate';
    if (path.includes('/images-order')) return 'images.reorder';
    if (path.includes('/visibility')) return 'image.visibility';
    if (path.includes('/primary')) return 'image.primary';
    if (/\/image$/.test(path)) return 'image.upload';
    if (/\/images\/\d+$/.test(path) && request.method === 'DELETE') {
      return 'image.delete';
    }
    if (path.endsWith('/best-sellers')) return 'best-sellers.update';
    return `${this.resourceName(path)}.${request.method === 'POST' ? 'create' : request.method === 'PATCH' ? 'update' : 'delete'}`;
  }

  private resourceName(path: string) {
    const names: Record<string, string> = {
      products: 'product',
      categories: 'category',
      ingredients: 'ingredient',
      allergens: 'allergen',
      users: 'user',
      tables: 'table',
    };
    const plural = Object.keys(names).find((name) =>
      path.includes(`/admin/${name}`),
    );
    return plural ? names[plural] : 'resource';
  }

  private async safeSnapshot(resource: AuditResource) {
    try {
      return await this.auditService.snapshot(resource);
    } catch (error) {
      this.logger.error('Unable to capture an administrative snapshot', error);
      return null;
    }
  }
}
