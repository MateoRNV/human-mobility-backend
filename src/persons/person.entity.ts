import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FormSubmission } from '../forms/entities/form-submission.entity';

@Index('UQ_PERSONA_DOCUMENTO', ['documento'], {
  unique: true,
  where: 'documento IS NOT NULL',
})
@Index('UQ_PERSONA_NOMBRE_SIN_DOCUMENTO', ['nombre', 'documento'], {
  unique: true,
  where: 'documento IS NULL',
})
@Entity('personas')
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre', type: 'nvarchar', length: 255 })
  nombre: string;

  @Column({ name: 'documento', type: 'nvarchar', length: 100, nullable: true })
  documento: string | null;

  @Index()
  @Column({ name: 'numero_caso', type: 'nvarchar', length: 50, nullable: true })
  numeroCaso: string | null;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  @ManyToOne(() => Person, (person) => person.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Person | null;

  @OneToMany(() => Person, (person) => person.parent)
  children: Person[];

  @Column({ type: 'bit', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime2', precision: 3 })
  fechaCreacion: Date;

  @UpdateDateColumn({
    name: 'fecha_modificacion',
    type: 'datetime2',
    precision: 3,
  })
  fechaModificacion: Date;

  @Column({
    name: 'usuario_creacion',
    type: 'nvarchar',
    length: 100,
    nullable: true,
  })
  usuarioCreacion: string | null;

  @Column({
    name: 'usuario_modificacion',
    type: 'nvarchar',
    length: 100,
    nullable: true,
  })
  usuarioModificacion: string | null;

  @OneToMany(() => FormSubmission, (fs) => fs.persona)
  enviosCuestionario: FormSubmission[];
}
