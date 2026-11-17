import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Users } from './users.entity';
import { TemplateType } from './templates.entity';

@Entity({ name: 'user_otp_codes', schema: 'public' })
export class UserOtpCodes {
  @PrimaryGeneratedColumn({ name: "id" })
  id?: number;

  @Column('int', { name: 'user_id', nullable: false })
  userId?: number;

  @Column("varchar", { length: 30, name: "type", nullable: false })
  type!: TemplateType;

  @Column('varchar', { length: 20, name: 'otp_code', nullable: false })
  otpCode?: string;

  @Column("boolean", { default: false, nullable: false })
  used!: boolean;

  @Column("timestamptz", { nullable: true, default: null, name: 'expired_date' })
  expiredDate?: Date;

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

  @ManyToOne(() => Users, (user) => user)
  @JoinColumn({ name: "user_id" })
  public user?: Users;
}