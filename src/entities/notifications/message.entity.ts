import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MessageType {
  PUSH = "PUSH",
  EMAIL = "EMAIL",
  SMS = "SMS",
  GATEWAY = "GATEWAY",
}

export enum CategoryType {
  SCHEDULE = "SCHEDULE",
  CHAT = "CHAT",
  INFO = "INFO",
  OPPORTUNITY = "OPPORTUNITY",
}

@Entity({ name: 'messages', schema: 'notifications' })
export class Messages {
  @PrimaryGeneratedColumn({ name: "message_id" })
  messageId?: number;

  @Column("int", { name: "party_id" })
  partyId?: number;

  @Column("int", { name: "agent_id" })
  agentId?: number;

  @Column("int", { name: "template_id" })
  templateId?: number;

  @Column("int", { name: "opportunity_id" })
  opportunityId?: number;

  @Column("varchar", { length: 30, name: "type" })
  type?: MessageType;

  @Column("varchar", { length: 30, name: "category_type" })
  categoryType?: CategoryType;

  @Column("varchar", { name: "identifier" })
  identifier?: string;

  @Column("text", { name: "text" })
  text?: string;

  @Column("jsonb", { name: "parameters", nullable: false, default: {} })
  parameters?: string;

  @Column("boolean", { name: "sent", default: false })
  sent?: boolean;

  @Column("boolean", { name: "deleted", default: false })
  deleted?: boolean;

  @Column("boolean", { name: "confirmed", default: false })
  confirmed?: boolean;

  @Column("boolean", { name: "declined", default: false })
  declined?: boolean;

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