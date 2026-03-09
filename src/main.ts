import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { UserCodes } from './users/users.codes';
import { efail } from '@common/response/response.helper';
import { TraceInterceptor } from '@common/interceptors/trace.interceptor';
import { existsSync } from 'node:fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const details = errors.map((e) => ({
          field: e.property,
          messages: Object.values(e.constraints ?? {}),
        }));
        return new BadRequestException(
          efail('Validation failed', UserCodes.USER_INVALID_DATA, details),
        );
      },
    }),
  );

  app.useGlobalInterceptors(
    new TraceInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  // const protoFile = existsSync(join(__dirname, './users/grpc/users.proto'))
  //   ? join(__dirname, './users/grpc/users.proto')
  //   : join(__dirname, '../users/grpc/users.proto');

  const protoFile = join(__dirname, '../src/users/grpc/users.proto');

  console.log(protoFile);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: protoFile,
      url: '[::]:50051',
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 9002);
}

bootstrap();
