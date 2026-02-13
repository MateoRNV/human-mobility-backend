import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Person } from '../person/person.entity';

/** Una entrega de un cuestionario por persona (triaje, legal, etc.) */
@Entity('envios_cuestionario')
@Unique(['personId', 'formSlug'])
export class FormSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'persona_id' })
  personId: number;

  @ManyToOne(() => Person, (p) => p.formSubmissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  person: Person;

  @Column({ name: 'cuestionario_slug', type: 'nvarchar', length: 50 })
  formSlug: string;

  @Column({ name: 'version_cuestionario', type: 'int', default: 1 })
  formVersion: number;

  /** Respuestas: array de { fieldId, type, value?, selections?, observationsValue?, extraValue? } */
  @Column({ name: 'respuestas_json', type: 'nvarchar', length: 'MAX', nullable: true })
  answersJson: string | null;

  @Column({ name: 'enviado_en', type: 'datetime2', precision: 3, nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'bit', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime2', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion', type: 'datetime2', precision: 3 })
  updatedAt: Date;

  @Column({ name: 'usuario_creacion', type: 'nvarchar', length: 100, nullable: true })
  usuarioCreacion: string | null;

  @Column({ name: 'usuario_modificacion', type: 'nvarchar', length: 100, nullable: true })
  usuarioModificacion: string | null;
}
