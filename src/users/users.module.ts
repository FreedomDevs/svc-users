import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersGrpcController } from './grpc/users.grpc.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [UsersController, UsersGrpcController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
