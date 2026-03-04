import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProfesionalRol {
  ADMIN = 'admin',
  TRABAJADOR_SOCIAL = 'trabajador_social',
  PSICOLOGO = 'psicologo',
  ABOGADO = 'abogado',
  CONSULTA = 'consulta',
}

@Entity('profesionales')
export class Profesional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'nvarchar', length: 255 })
  password: string;

  @Column({ type: 'nvarchar', length: 255 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 255 })
  apellido: string;

  @Column({ type: 'nvarchar', length: 50, default: ProfesionalRol.CONSULTA })
  rol: ProfesionalRol;

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
}
