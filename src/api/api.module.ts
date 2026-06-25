import { Module } from '@nestjs/common';
import { UsersModule } from '@/api/users/users.module';
import { HealthModule } from '@/api/health/health.module';
import { GroupsModule } from '@/api/groups/groups.module';

@Module({
  imports: [UsersModule, HealthModule, GroupsModule],
})
export class ApiModule {}
