import { Module } from '@nestjs/common';
import { InfraModule } from '@/infra/infra.module';
import { ApiModule } from '@/api/api.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InfraModule,
    ApiModule,
  ],
  providers: [],
})
export class AppModule {}
