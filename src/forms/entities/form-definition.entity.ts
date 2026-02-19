import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';

@Entity('definiciones_cuestionario')
@Unique(['slug', 'version'])
export class FormDefinition {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'nvarchar', length: 50 })
    slug: string;

    @Column({ type: 'int', default: 1 })
    version: number;

    @Column({ name: 'nombre', type: 'nvarchar', length: 200, nullable: true })
    nombre: string | null;

    @Column({ name: 'configuracion_json', type: 'nvarchar', length: 'MAX', nullable: true })
    configuracionJson: string | null;

    @Column({ type: 'bit', default: true })
    activo: boolean;

    @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime2', precision: 3 })
    fechaCreacion: Date;

    @UpdateDateColumn({ name: 'fecha_modificacion', type: 'datetime2', precision: 3 })
    fechaModificacion: Date;

    @Column({ name: 'usuario_creacion', type: 'nvarchar', length: 100, nullable: true })
    usuarioCreacion: string | null;

    @Column({ name: 'usuario_modificacion', type: 'nvarchar', length: 100, nullable: true })
    usuarioModificacion: string | null;
}
