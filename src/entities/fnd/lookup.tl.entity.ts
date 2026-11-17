import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FndLanguages } from './languages.entity';
import { FndLookups } from './lookups.entity';

@Entity({ name: 'fnd_lookups_tl', schema: 'fnd' })
export class FndLookupTl {
  @PrimaryGeneratedColumn({ name: "lookup_tl_id" })
  lookupTlId?: number;

  @Column({ name: "language_id" })
  languageId?: number;

  @Column({ name: "lookup_id" })
  lookupId?: number;

  @Column("varchar", { length: 255, name: "meaning", nullable: true, default: null })
  meaning?: string;

  @Column("varchar", { length: 255, name: "description", nullable: true, default: null })
  description?: string;

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

  @ManyToOne(() => FndLanguages, (lookupLanguage) => lookupLanguage.lookupTl)
  @JoinColumn({ name: "language_id", referencedColumnName: 'languageId' })
  public lookupLanguage?: FndLanguages;

  @ManyToOne(() => FndLookups, (lookup) => lookup.lookupTl)
  @JoinColumn({ name: "lookup_id", referencedColumnName: 'lookupId' })
  public lookup?: FndLookups;

}