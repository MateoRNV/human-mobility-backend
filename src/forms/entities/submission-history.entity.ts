import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('historial_envios')
export class SubmissionHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'persona_id', type: 'int' })
  personaId: number;

  @Column({ name: 'cuestionario_slug', type: 'nvarchar', length: 50 })
  cuestionarioSlug: string;

  @Column({ name: 'version_cuestionario', type: 'int' })
  versionCuestionario: number;

  @Column({
    name: 'respuestas_json',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
  })
  respuestasJson: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime2', precision: 3 })
  fechaCreacion: Date;

  @Column({
    name: 'usuario_creacion',
    type: 'nvarchar',
    length: 100,
    nullable: true,
  })
  usuarioCreacion: string | null;
}
