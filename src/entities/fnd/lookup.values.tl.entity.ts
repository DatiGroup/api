import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { FndLanguages } from './languages.entity';
import { FndLookups } from './lookups.entity';
import { FndLookupValues } from './lookup.values.entity';

@Entity({ name: 'fnd_lookup_values_tl', schema: 'fnd' })
export class FndLookupValuesTl {
  @PrimaryGeneratedColumn({ name: "lookup_value_tl_id" })
  lookupValueTlId?: number;

  @Column({ name: "lookup_value_id" })
  lookupValueId?: number;

  @Column({ name: "language_id" })
  languageId?: number;

  @Column("varchar", { length: 255, name: "meaning", nullable: true, default: null })
  meaning?: string;

  @Column("varchar", { length: 255, name: "description", nullable: true, default: null })
  description?: string;

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

  @ManyToOne(() => FndLanguages, (lookupLanguage) => lookupLanguage.lookupValuesTl)
  @JoinColumn({ name: "language_id" })
  public lookupLanguage?: FndLanguages;

  @ManyToOne(() => FndLookupValues, (lookupValue) => lookupValue.lookupValuesTl)
  @JoinColumn({ name: "lookup_value_id", referencedColumnName: 'lookupValueId' })
  public lookupValues?: FndLookups;

}