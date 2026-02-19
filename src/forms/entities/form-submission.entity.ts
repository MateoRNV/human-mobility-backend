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
import { Person } from '../../persons/person.entity';

@Entity('envios_cuestionario')
@Unique(['personaId', 'cuestionarioSlug'])
export class FormSubmission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'persona_id' })
    personaId: number;

    @ManyToOne(() => Person, (p) => p.enviosCuestionario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona: Person;

    @Column({ name: 'cuestionario_slug', type: 'nvarchar', length: 50 })
    cuestionarioSlug: string;

    @Column({ name: 'version_cuestionario', type: 'int', default: 1 })
    versionCuestionario: number;

    @Column({ name: 'respuestas_json', type: 'nvarchar', length: 'MAX', nullable: true })
    respuestasJson: string | null;

    @Column({ name: 'enviado_en', type: 'datetime2', precision: 3, nullable: true })
    enviadoEn: Date | null;

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
