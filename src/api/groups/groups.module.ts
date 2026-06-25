import { Module } from '@nestjs/common';
import { GroupsService } from '@/api/groups/groups.service';
import { GroupsController } from '@/api/groups/groups.controller';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
