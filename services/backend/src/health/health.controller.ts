import { Controller, Get, Header } from '@nestjs/common';
import type { LivenessResponse } from './health.contract';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @Header('Cache-Control', 'no-store')
  getLiveness(): LivenessResponse {
    return this.healthService.getLiveness();
  }
}
