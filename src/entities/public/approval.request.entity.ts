import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, VersionColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Users } from './users.entity';
import { Approval } from './approval.entity';
import { ApprovalRequestStatusEnum } from '../../types/ApprovalRequestStatusEnum';


@Entity('approval_requests', { schema: 'public' })
export class ApprovalRequest {
  @PrimaryGeneratedColumn({ name: 'approval_request_id', type: 'int' })
  approvalRequestId: number;

  @Column({ name: 'entity_type', type: 'varchar', length: 100, nullable: false })
  entityType: string;

  @Column({ name: 'entity_id', type: 'int', nullable: false })
  entityId: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ApprovalRequestStatusEnum,
    default: ApprovalRequestStatusEnum.PENDING,
    nullable: false
  })
  status: ApprovalRequestStatusEnum;

  @Column({ name: 'assigned_to_user_id', type: 'int', nullable: true })
  assignedToUserId?: number;

  @Column({ name: 'assigned_to_kc_group', type: 'varchar', length: 255, nullable: true })
  assignedToKcGroup?: string;

  @Column({ name: 'min_required_approvals', type: 'int', default: 1, nullable: false })
  minRequiredApprovals: number;

  @Column({ name: 'current_approvals_count', type: 'int', default: 0, nullable: false })
  currentApprovalsCount: number;

  @Column({ name: 'created_by', type: 'int', nullable: false })
  createdBy: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: false })
  updatedBy: number;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date;

  @VersionColumn({ name: 'version', type: 'int', default: 1 })
  version: number;


  @ManyToOne(() => Users)
  @JoinColumn({ name: 'entity_id', referencedColumnName: 'userId' })
  user: Users;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'assigned_to_user_id', referencedColumnName: 'userId' })
  assignedToUser: Users;

  @OneToMany(() => Approval, approval => approval.approvalRequest)
  approvals: Approval[];
}