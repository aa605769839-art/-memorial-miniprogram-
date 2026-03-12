import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是统一格式，直接返回
        if (data && typeof data === 'object' && 'code' in data && 'msg' in data && 'data' in data) {
          return data;
        }
        // 否则包装成统一格式
        return {
          code: 200,
          msg: 'success',
          data,
        };
      }),
    );
  }
}
