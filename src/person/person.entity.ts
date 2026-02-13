import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FormSubmission } from '../form-submission/form-submission.entity';

@Entity('personas')
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre', type: 'nvarchar', length: 255 })
  name: string;

  @Column({ name: 'documento', type: 'nvarchar', length: 100, nullable: true })
  document: string | null;

  /** Servicios derivados del triaje (fld-60): trabajo_social, psicologia, legal, promocion_medios_vida */
  @Column({ name: 'servicios_derivados', type: 'nvarchar', length: 500, nullable: true })
  derivedServices: string | null; // JSON array string, e.g. '["trabajo_social","legal"]'

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

  @OneToMany(() => FormSubmission, (fs) => fs.person)
  formSubmissions: FormSubmission[];
}
