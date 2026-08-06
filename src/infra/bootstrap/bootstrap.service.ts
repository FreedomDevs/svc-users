import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  public constructor(private readonly prisma: PrismaService) {}

  public async onModuleInit(): Promise<void> {
    this.logger.log('🔄 Running application bootstrap...');

    await this.createDefaultGroups();

    this.logger.log('✅ Application bootstrap completed.');
  }

  private async createDefaultGroups(): Promise<void> {
    await this.prisma.group.upsert({
      where: {
        name: 'User',
      },
      update: {},
      create: {
        name: 'User',
        permissions: [],
      },
    });

    this.logger.log('✅ Default group "User" is ready.');
  }
}
