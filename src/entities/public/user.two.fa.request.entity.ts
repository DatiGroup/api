import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Users } from "./users.entity";


@Entity({ name: 'user_two_fa_request', schema: 'public' })
export class UserTwoFARequest {

    @PrimaryGeneratedColumn()
    id?: number;

    @Column("int", { name: 'user_id', nullable: true, default: null })
    userId: number;

    @Column("int")
    code: number;


    @Column("boolean", { default: false, name: 'used' })
    used: boolean;

    @CreateDateColumn({ name: 'created_date' })
    createdDate: Date;

    @UpdateDateColumn({ name: 'updated_date' })
    updatedDate: Date;

    @Column("int", { nullable: true, name: 'approved_by' })
    approvedBy: number;

    @Column("int", { nullable: true, name: 'rejected_by' })
    rejectedBy: number;

    @Column("timestamptz", { nullable: true, default: null, name: 'expired_date' })
    expiredDate: Date;

    @Column("text", { nullable: true })
    meta: string;

    @Column("varchar", { length: 40, nullable: true, default: null, name: 'wlp_id' })
    agent: string;

    @ManyToOne(type => Users)
    @JoinColumn({ name: 'user_id' })
    user: Users;

    @ManyToOne(type => Users)
    @JoinColumn({ name: 'approved_by' })
    approvedByUser: Users;

    @ManyToOne(type => Users)
    @JoinColumn({ name: 'rejected_by' })
    rejectedByUser: Users;
}