import { BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TermsEnumType {
  PRIVACY_POLICY = "PRIVACY_POLICY",
  TERMS_AND_CONDITIONS = "TERMS_AND_CONDITIONS"
}

@Entity({ name: 'terms', schema: 'public' })
export class Terms {
  @PrimaryGeneratedColumn({ name: "term_id" })
  termId: number;

  @Column("varchar", { length: 30, name: "version", nullable: true })
  version: string;

  @Column("varchar", { length: 30, name: "type", nullable: false })
  type: TermsEnumType;

  @Column("int", { name: "agent_id", nullable: false })
  agentId: number;

  @Column("varchar", { length: 2, name: "language_code", nullable: false })
  languageCode: string;

  @Column('text', { name: 'content_html', nullable: false })
  contentHtml: string;

  @Column("timestamptz", { name: "start_date_active" })
  startDateActive: Date;

  @Column("timestamptz", { nullable: true, default: null, name: "end_date_active" })
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