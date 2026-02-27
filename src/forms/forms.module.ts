import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormDefinition } from './entities/form-definition.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { SubmissionHistory } from './entities/submission-history.entity';
import { FormsService } from './forms.service';
import { FormsSeederService } from './forms-seeder.service';
import { FormsController } from './forms.controller';
import { SubmissionsService } from './submissions.service';
import { Person } from '../persons/person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormDefinition,
      FormSubmission,
      SubmissionHistory,
      Person,
    ]),
  ],
  controllers: [FormsController],
  providers: [FormsService, FormsSeederService, SubmissionsService],
  exports: [TypeOrmModule, FormsService, SubmissionsService],
})
export class FormsModule {}
