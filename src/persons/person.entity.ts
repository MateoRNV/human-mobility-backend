import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { FormSubmission } from '../forms/entities/form-submission.entity';

@Entity('personas')
export class Person {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'nombre', type: 'nvarchar', length: 255 })
    nombre: string;

    @Column({ name: 'documento', type: 'nvarchar', length: 100, nullable: true })
    documento: string | null;

    /** Cuestionarios asignados (triaje, derivados, etc.) */
    @Column({
        name: 'cuestionarios',
        type: 'nvarchar',
        length: 'MAX',
        nullable: true,
        transformer: {
            to: (value: string[]) => JSON.stringify(value),
            from: (value: string) => JSON.parse(value || '[]'),
        },
    })
    cuestionarios: string[];

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

    @OneToMany(() => FormSubmission, (fs) => fs.persona)
    enviosCuestionario: FormSubmission[];
}
