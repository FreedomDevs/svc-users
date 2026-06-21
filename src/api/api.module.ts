import { Module } from '@nestjs/common';
import { UsersModule } from '@/api/users/users.module';
import { HealthModule } from '@/api/health/health.module';

@Module({
  imports: [UsersModule, HealthModule],
})
export class ApiModule {}
