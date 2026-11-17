import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AgentType {
  SCHEDULE = "SCHEDULE",
  VARIABLE = "VARIABLE",
  EVENTS = "EVENTS",
  VACATION = "VACATION",
  CONSTRUCTION = "CONSTRUCTION",
}

@Entity({ name: 'agents', schema: 'public' })
export class Agents {
  @PrimaryGeneratedColumn({ name: "agent_id" })
  agentId?: number;

  @Column("varchar", { length: 30, name: "agent_code" })
  agentCode?: string;

  @Column("varchar", { length: 30, name: "agent_type" })
  agentType?: AgentType;

  @Column("jsonb", { name: "parameters", nullable: false, default: {} })
  parameters?: any;

  @Column("varchar", { length: 100, name: "info_email" })
  infoEmail?: string;

  @Column("uuid", { name: "uuid", nullable: true })
  uuid?: string;

  @Column("timestamp", { nullable: true, default: null, name: "start_date_active" })
  startDateActive?: Date;

  @Column("timestamp", { nullable: true, default: null, name: "end_date_active" })
  endDateActive?: Date;

  @CreateDateColumn({ name: "created_date", default: () => "CURRENT_TIMESTAMP" })
  createdDate?: Date;

  @Column({ name: "created_by" })
  createdBy?: number;

  @Column({ name: "updated_by" })
  updatedBy?: number;

  @UpdateDateColumn({ name: "updated_date", default: () => "CURRENT_TIMESTAMP" })
  updatedDate?: Date;

  @BeforeUpdate()
  public setUpdateDate?(): void {
    this.updatedDate = new Date();
  }
}