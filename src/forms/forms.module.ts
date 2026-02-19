import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormDefinition } from './entities/form-definition.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { FormsService } from './forms.service';
import { FormsSeederService } from './forms-seeder.service';
import { FormsController } from './forms.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FormDefinition, FormSubmission])],
    controllers: [FormsController],
    providers: [FormsService, FormsSeederService],
    exports: [TypeOrmModule, FormsService],
})
export class FormsModule { }
