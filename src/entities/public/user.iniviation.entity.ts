import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Users } from './users.entity';
import { UserOrganization } from './user.organizations.entity';

@Entity({ name: 'user_invitation', schema: 'public' })
export class UserInvitation {
  @PrimaryGeneratedColumn({ name: "invitation_id" })
  invitationId?: number;

  @Column({ name: "user_organization_id", type: "integer" })
  userOrganizationId!: number;

  @Column('int', { name: 'user_id', nullable: false })
  userId: number;

  @Column("varchar", { length: 100, name: "email" })
  email: string;

  @Column('varchar', { length: 32, name: 'invitation_code', nullable: false })
  invitationCode?: string;

  @Column("boolean", { default: false, nullable: false })
  used!: boolean;

  @Column("timestamptz", { nullable: true, default: null, name: 'used_date' })
  usedDate?: Date;

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

  @ManyToOne(() => UserOrganization, org => org.relationships)
  @JoinColumn({ name: "user_organization_id", referencedColumnName: "userOrganizationId" })
  userOrganization: UserOrganization;

  @ManyToOne(() => Users, user => user.adminActivityLogs)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'userId' })
  createdByUser: Users;
}