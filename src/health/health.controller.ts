import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import * as os from 'node:os';
import { ok } from '@common/response/response.helper';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getHealth() {
    let dbStatus = 'OK';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'ERROR';
      console.log(e);
    }

    const status = dbStatus === 'OK' ? 'UP' : 'ERROR';
    const ready = status === 'UP';

    const systemMetrics = {
      arch: os.arch(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
    };

    return ok(
      {
        status,
        ready,
        details: {
          database: dbStatus,
          system: systemMetrics,
        },
      },
      ready
        ? 'Сервис работает и готов к приему трафика'
        : 'Проблемы со здоровьем сервиса',
      status === 'UP' ? 'HEALTH_OK' : 'HEALTH_ERROR',
    );
  }

  @Get('live')
  live() {
    return ok({ alive: true }, 'svc-users жив', 'LIVE_OK');
  }
}
