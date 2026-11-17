import { BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'sessions', schema: 'public' })
export class Sessions {
  @PrimaryColumn("varchar", { length: 100, name: "session_id" })
  sessionId?: string;

  @Column("int", { name: "user_device_id" })
  userDeviceId?: number;

  @Column("int", { name: "user_id" })
  userId?: number;

  @Column("varchar", { name: "ip_address" })
  ipAddress?: string;

  @Column("varchar", { name: "location" })
  location?: string;

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