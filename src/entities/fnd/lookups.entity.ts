import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FndLookupValues } from './lookup.values.entity';
import { FndLookupTl } from './lookup.tl.entity';

@Entity({ name: 'fnd_lookups', schema: 'fnd' })
export class FndLookups {
  @PrimaryGeneratedColumn({ name: "lookup_id" })
  lookupId?: number;

  @Column("varchar", { length: 100, name: "lookup_type", unique: true })
  lookupType?: string;

  @Column("varchar", { length: 100, name: "purpose", unique: true })
  purpose?: string;

  @Column("boolean", { name: "enabled", default: true })
  enabled!: boolean;

  @Column("boolean", { name: "editable", default: false })
  editable!: boolean;

  @Column({ name: "agent_id", nullable: true, default: null })
  agentId?: number;

  @Column("timestamptz", { nullable: true, default: null, name: "start_date_active" })
  startDateActive?: Date;

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

  @OneToMany(() => FndLookupValues, (lookupValues) => lookupValues.lookupHeader)
  @JoinColumn({ name: "lookup_type" })
  public lookupValues?: FndLookupValues[];

  @OneToMany(() => FndLookupTl, (lookupValuesTl) => lookupValuesTl.lookup)
  @JoinColumn({ name: "lookup_id", referencedColumnName: 'lookupId' })
  public lookupTl?: FndLookupTl[];
}