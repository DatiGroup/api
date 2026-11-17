import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, VersionColumn, OneToMany } from 'typeorm';
import { ApprovalRequest } from './approval.request.entity';
import { Users } from './users.entity';
import { ApprovalActionEnum } from '../../types/ApprovalActionEnum';



@Entity('approval', { schema: 'public' })
export class Approval {
  @PrimaryGeneratedColumn({ name: 'approval_id', type: 'int' })
  approvalId: number;

  @Column({ name: 'approval_request_id', type: 'int', nullable: false })
  approvalRequestId: number;

  @Column({ name: 'approved_by_user_id', type: 'int', nullable: false })
  approvedByUserId: number;

  @Column({
    name: 'action',
    type: 'enum',
    enum: ApprovalActionEnum,
    nullable: false
  })
  action: ApprovalActionEnum;

  @Column({ name: 'comments', type: 'text', nullable: true })
  comments?: string;

  @CreateDateColumn({ name: 'acted_at', type: 'timestamp', default: () => 'NOW()' })
  actedAt: Date;


  @VersionColumn({ name: 'version', type: 'int', default: 1 })
  version: number;

  @ManyToOne(() => ApprovalRequest, approvalRequest => approvalRequest.approvals)
  @JoinColumn({ name: 'approval_request_id', referencedColumnName: 'approvalRequestId' })
  approvalRequest: ApprovalRequest;


  @ManyToOne(() => Users, user => user.approvals)
  @JoinColumn({ name: 'approved_by_user_id', referencedColumnName: 'userId' })
  approvedByUser: Users;

}
