import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Person } from './persons/person.entity';
import { FormSubmission } from './forms/entities/form-submission.entity';
import { FormDefinition } from './forms/entities/form-definition.entity';
import { SubmissionHistory } from './forms/entities/submission-history.entity';
import { Profesional } from './auth/profesional.entity';
import { PersonsModule } from './persons/persons.module';
import { FormsModule } from './forms/forms.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.MSSQL_HOST ?? 'localhost',
      port: parseInt(process.env.MSSQL_PORT ?? '1433', 10),
      username: process.env.MSSQL_USER ?? 'sa',
      password: process.env.MSSQL_PASSWORD ?? '',
      database: process.env.MSSQL_DATABASE ?? 'HumanMobility',
      options: {
        encrypt: process.env.MSSQL_OPTIONS_ENCRYPT === 'true',
        trustServerCertificate:
          process.env.MSSQL_OPTIONS_TRUST_SERVER_CERTIFICATE !== 'false',
        enableArithAbort: true,
        connectTimeout: 30000,
      },
      connectionTimeout: 30000,
      entities: [Person, FormSubmission, FormDefinition, SubmissionHistory, Profesional],
      synchronize: true,
      retryAttempts: 3,
    }),
    PersonsModule,
    FormsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
