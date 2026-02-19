import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './person.entity';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';
import { FormsModule } from '../forms/forms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Person]),
    FormsModule,
  ],
  controllers: [PersonsController],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule { }
