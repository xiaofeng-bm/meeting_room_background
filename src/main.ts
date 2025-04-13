import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FormatResponseInterceptor } from './aop/format-response.interceptor';
import { ConfigService } from '@nestjs/config';
import { InvokeRecordInterceptor } from './aop/invoke-record.interceptor';
import { UnloginFilter } from './aop/unlogin.filter';
import { CustomExceptionFilter } from './aop/custom-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors(); // 允许跨域

  app.useStaticAssets('uploads', {
    prefix: '/uploads',
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new FormatResponseInterceptor());
  app.useGlobalInterceptors(new InvokeRecordInterceptor());
  app.useGlobalFilters(new UnloginFilter());
  app.useGlobalFilters(new CustomExceptionFilter());


  const config = new DocumentBuilder()
    .setTitle('会议室预定系统')
    .setDescription('会议室预定系统的API文档')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      description: '基于 jwt 的认证',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const configService = app.get(ConfigService);


  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
  await app.listen(configService.get('nestjs_port'));
}
bootstrap();
