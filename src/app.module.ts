import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PrismaModule, UsersModule, HealthModule],
  controllers: [UsersController],
  providers: [],
})
export class AppModule {}
