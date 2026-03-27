import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from './pipes/validation.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
async function start() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = new DocumentBuilder()
    .setTitle('scanner')
    .setDescription('scanner')
    .setVersion('1.0.5')
    .addTag('scanner')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);
  // app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(PORT, () => {
    console.log(`scanner started on port ${PORT}`);
  });
}

start();

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// async function start() {
//   const PORT = process.env.PORT || 5000;
//   const app = NestFactory.create(AppModule);
//   const config = new DocumentBuilder()
//     .setTitle('nest')
//     .setDescription('nest')
//     .setVersion('1.0.0')
//     .addTag('nest')
//     .build();
//   const document = SwaggerModule.createDocument(await app, config);

//   SwaggerModule.setup(
//     '/api/docs',
//     app,
//     document,
//   )
//   (await app).enableCors();
//   (await app).listen(PORT, () => {
//     console.log(`server started in port ${PORT}`);
//   });
// }

// start();
