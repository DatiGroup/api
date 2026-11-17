import { BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TemplateType {
  SMS = "SMS",
  EMAIL = "EMAIL",
  PUSH = "PUSH",
}

@Entity({ name: 'templates', schema: 'public' })
export class Templates {
  @PrimaryGeneratedColumn({ name: "template_id" })
  templateId?: number;

  @Column("varchar", { length: 30, name: "type" })
  type!: TemplateType;

  @Column({ length: 100, name: 'identifier', nullable: false })
  identifier?: string;

  @Column({ length: 200, name: 'subject', nullable: true })
  subject?: string;

  @Column({ name: 'content', nullable: true })
  content?: string;

  @Column({length: 2, name: 'lang', nullable: false, default: 'en' })
  lang?: string;

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