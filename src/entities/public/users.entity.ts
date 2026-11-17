import { BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Agents } from './agents.entity';
import { UserDevices } from './devices.entity';
import { UserProfile } from './users.profile.entity';
import { ApprovalRequest } from './approval.request.entity';
import { Approval } from './approval.entity';
import { ApprovalRequestStatusEnum } from '../../types/ApprovalRequestStatusEnum';
import { AdminActivityLog } from './admin.activity.log.entity';
import { UserRelationship } from './user.relationships.entity';
import { UserOrganization } from './user.organizations.entity';
import { UserInvitation } from './user.iniviation.entity';

@Entity({ name: 'users', schema: 'public' })
export class Users {
  @PrimaryGeneratedColumn({ name: "user_id" })
  userId?: number;

  @Column("int", { name: "agent_id" })
  agentId?: number;

  @Column("varchar", { length: 30, name: "user_name", nullable: false, })
  userName?: string;

  @Column("varchar", { length: 100, name: "email", nullable: true, default: null })
  email?: string;

  @Column("uuid", { name: "uuid", nullable: true })
  uuid?: string;

  @Column("varchar", { length: 64, name: "password", nullable: true })
  password?: string;

  @Column("varchar", { length: 48, name: "salt", nullable: true })
  salt?: string;

  @Column("varchar", { length: 100, name: "external_user_id", nullable: true, default: null })
  externalUserId?: string;

  @Column("varchar", { length: 100, name: "external_source", nullable: true, default: null })
  externalSource?: string;

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


  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: ApprovalRequestStatusEnum,
    default: ApprovalRequestStatusEnum.PENDING,
    nullable: false
  })
  approvalStatus: ApprovalRequestStatusEnum;

  @BeforeUpdate()
  public setUpdateDate?(): void {
    this.updatedDate = new Date();
  }

  @ManyToOne(() => Agents, (agent) => agent.agentId)
  @JoinColumn({ name: "agent_id" })
  public agent?: Agents;

  @OneToMany(() => UserDevices, (devices) => devices.user)
  @JoinColumn({ name: "user_id" })
  public devices?: UserDevices[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  public profile?: UserProfile;

  @OneToMany(() => ApprovalRequest, approvalRequest => approvalRequest.user)
  approvalRequests: ApprovalRequest[];

  @OneToMany(() => ApprovalRequest, approvalRequest => approvalRequest.assignedToUser)
  assignedApprovalRequests: ApprovalRequest[];


  @OneToMany(() => Approval, approval => approval.approvedByUser)
  approvals: Approval[];

  @OneToMany(() => AdminActivityLog, adminActivityLog => adminActivityLog.createdByUser)
  adminActivityLogs: AdminActivityLog[];

  @OneToMany(() => UserRelationship, rel => rel.user)
  @JoinColumn({ name: "user_id", referencedColumnName: "userId" })
  public relationships: UserRelationship[];


  @OneToMany(() => UserOrganization, rel => rel.rootUser)
  @JoinColumn({ name: "user_id", referencedColumnName: "rootUserId" })
  ownedOrganizations: UserOrganization[];


  @OneToMany(() => UserInvitation, rel => rel.user)
  @JoinColumn({ name: "user_id", referencedColumnName: "userId" })
  userInvitations: UserInvitation[];
}
