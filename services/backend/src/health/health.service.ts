import { Injectable } from '@nestjs/common';
import type { LivenessResponse } from './health.contract';

@Injectable()
export class HealthService {
  getLiveness(): LivenessResponse {
    return { status: 'ok' };
  }
}
