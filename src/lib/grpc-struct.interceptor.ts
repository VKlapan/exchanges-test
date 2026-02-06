import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { jsObjectToStruct } from './grpc-struct';

@Injectable()
export class GrpcStructInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isRpc = context.getType() === 'rpc';

    return next.handle().pipe(
      map((response) => {
        if (!isRpc) return response;
        if (!response || typeof response !== 'object') return response;

        // If response already has protobuf Struct shape, skip
        if (response.data && typeof response.data === 'object' && 'fields' in response.data) {
          return response;
        }

        // Convert only when response.data exists and is an object (or other JSON-serializable)
        if ('data' in response) {
          try {
            // Ensure plain JSON (remove prototypes, functions, etc.)
            const plain = JSON.parse(JSON.stringify(response.data));
            response.data = jsObjectToStruct(plain);
          } catch (e) {
            // fallback: leave original response.data
          }
        }

        return response;
      }),
    );
  }
}
