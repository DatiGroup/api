import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Users } from './users.entity';

@Entity({ name: 'devices', schema: 'public' })
export class UserDevices {
  @PrimaryGeneratedColumn({ name: "user_device_id" })
  userDeviceId?: number;

  @Column("int", { name: "user_id" })
  userId?: number;

  @Column("varchar", { length: 30, name: "platform" })
  platform?: string;

  @Column("varchar", { length: 30, name: "browser" })
  browser?: string;

  @Column("varchar", { length: 255, name: "fingerprint" })
  fingerprint?: string;

  @Column("varchar", { length: 30, name: "ip_address" })
  ip_address?: string;

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

  @ManyToOne(() => Users, (user) => user.devices)
  @JoinColumn({ name: "user_id" })
  public user?: Users;
}