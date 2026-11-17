import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FndLookupValuesTl } from './lookup.values.tl.entity';
import { FndLookupTl } from './lookup.tl.entity';

@Entity({ name: 'fnd_languages', schema: 'fnd' })
export class FndLanguages {
  @PrimaryGeneratedColumn({ name: "language_id" })
  languageId?: number;

  @Column("varchar", { length: 2, name: "language_code" })
  languageCode?: string;

  @Column("varchar", { length: 3, name: "iso_language" })
  isoLanguage?: string;

  @Column("varchar", { length: 255, name: "description", nullable: true, default: null })
  description?: string;

  @Column("boolean", { name: "enabled", default: true })
  enabled!: boolean;

  @Column("timestamptz", { nullable: true, default: null, name: "start_date_active" })
  startDateActive?: Date;

  @Column("timestamptz", { nullable: true, default: null, name: "end_date_active" })
  endDateActive?: Date;

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

  @OneToMany(() => FndLookupValuesTl, (lookupLanguage) => lookupLanguage.lookupLanguage)
  @JoinColumn({ name: "language_id" })
  public lookupValuesTl?: FndLookupValuesTl[];

  @OneToMany(() => FndLookupTl, (lookupLanguage) => lookupLanguage.lookupLanguage)
  @JoinColumn({ name: "language_id" })
  public lookupTl?: FndLookupTl[];
}