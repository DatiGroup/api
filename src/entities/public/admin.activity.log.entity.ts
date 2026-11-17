import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Users } from "./users.entity";

@Entity({ name: "admin_activity_log", schema: "public" })
export class AdminActivityLog {
    @PrimaryGeneratedColumn({ name: "admin_activity_log_id" })
    adminActivityLogId: number;

    @Column({ name: "agent_id", type: "int" })
    agentId: number;

    @Column({ name: "entity_type", type: "varchar", length: 30 })
    entityType: string;

    @Column({ name: "entity_id", type: "int", nullable: true })
    entityId?: number;

    @Column({ name: "action", type: "varchar", length: 50, nullable: true })
    action?: string;

    @Column({ name: "api", type: "text", nullable: true })
    api?: string;

    @Column({ name: "details", type: "jsonb", nullable: true })
    details?: any;

    @Column({ name: "request_id", type: "varchar", length: 40 })
    requestId?: string;

    @Column({ name: "created_by", type: "int" })
    createdBy: number;

    @CreateDateColumn({ name: "created_date", type: "timestamp", default: () => "now()" })
    createdDate: Date;

    @ManyToOne(() => Users, user => user.adminActivityLogs)
    @JoinColumn({ name: 'created_by', referencedColumnName: 'userId' })
    createdByUser: Users;

}