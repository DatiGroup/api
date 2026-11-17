import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FndLookups } from './lookups.entity';
import { FndLookupValuesTl } from './lookup.values.tl.entity';

@Entity({ name: 'fnd_lookup_values', schema: 'fnd' })
export class FndLookupValues {
  @PrimaryGeneratedColumn({ name: "lookup_value_id" })
  lookupValueId?: number;

  @Column("varchar", { length: 100, name: "lookup_type" })
  lookupType?: string;

  @Column("varchar", { length: 100, name: "lookup_code" })
  lookupCode?: string;

  @Column({ name: "agent_id", nullable: true, default: null })
  agentId?: number;

  @Column("boolean", { name: "enabled" })
  enabled!: boolean;

  @Column("timestamptz", {
    nullable: true,
    default: null,
    name: "start_date_active",
  })
  startDateActive?: Date;

  @Column("timestamptz", {
    nullable: true,
    default: null,
    name: "end_date_active",
  })
  endDateActive?: Date;

  @Column("varchar", { length: 100, name: "attribute1", nullable: true, default: null })
  attribute1?: string;

  @Column("varchar", { length: 100, name: "attribute2", nullable: true, default: null })
  attribute2?: string;

  @Column("varchar", { length: 100, name: "attribute3", nullable: true, default: null })
  attribute3?: string;

  @Column("varchar", { length: 100, name: "attribute4", nullable: true, default: null })
  attribute4?: string;

  @Column("varchar", { length: 100, name: "attribute5", nullable: true, default: null })
  attribute5?: string;

  @Column("varchar", { length: 100, name: "attribute6", nullable: true, default: null })
  attribute6?: string;

  @Column("varchar", { length: 100, name: "attribute7", nullable: true, default: null })
  attribute7?: string;

  @Column("varchar", { length: 100, name: "attribute8", nullable: true, default: null })
  attribute8?: string;

  @Column("varchar", { length: 100, name: "attribute9", nullable: true, default: null })
  attribute9?: string;

  @Column("varchar", { length: 100, name: "attribute10", nullable: true, default: null })
  attribute10?: string;

  @Column("varchar", { length: 100, name: "attribute11", nullable: true, default: null })
  attribute11?: string;

  @Column("varchar", { length: 100, name: "attribute12", nullable: true, default: null })
  attribute12?: string;

  @Column("varchar", { length: 100, name: "attribute13", nullable: true, default: null })
  attribute13?: string;

  @Column("varchar", { length: 100, name: "attribute14", nullable: true, default: null })
  attribute14?: string;

  @Column("varchar", { length: 100, name: "attribute15", nullable: true, default: null })
  attribute15?: string;

  @CreateDateColumn({ name: "created_date", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdDate?: Date;

  @Column({ name: "created_by" })
  createdBy?: number;

  @Column({ name: "updated_by" })
  updatedBy?: number;

  @UpdateDateColumn({ name: "updated_date", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedDate?: Date;

  @BeforeUpdate()
  public setUpdateDate?(): void {
    this.updatedDate = new Date();
  }

  @ManyToOne(() => FndLookups, (lookupHeader) => lookupHeader.lookupValues)
  @JoinColumn({ name: "lookup_type", referencedColumnName: 'lookupType' })
  public lookupHeader?: FndLookups;

  @OneToMany(() => FndLookupValuesTl, (lookupValuesTl) => lookupValuesTl.lookupValues)
  @JoinColumn({ name: "lookup_value_id", referencedColumnName: 'lookupValueId' })
  public lookupValuesTl?: FndLookupValuesTl[];

}