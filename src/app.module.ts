import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Person } from './persons/person.entity';
import { FormSubmission } from './forms/entities/form-submission.entity';
import { FormDefinition } from './forms/entities/form-definition.entity';
import { PersonsModule } from './persons/persons.module';
import { FormsModule } from './forms/forms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
      entities: [Person, FormSubmission, FormDefinition],
      synchronize: process.env.NODE_ENV !== 'production',
      retryAttempts: 3,
    }),
    PersonsModule,
    FormsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
