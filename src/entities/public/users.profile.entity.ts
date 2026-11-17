import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Users } from './users.entity';

@Entity({ name: 'user_profile', schema: 'public' })
export class UserProfile {
  @PrimaryGeneratedColumn({ name: "user_profile_id" })
  userProfileId?: number;

  @Column("int", { name: "user_id", unique: true })
  userId?: number;

  @Column("varchar", { length: 50, name: "first_name", nullable: true })
  firstName?: string;

  @Column("varchar", { length: 50, name: "last_name", nullable: true })
  lastName?: string;

  @Column("varchar", { length: 2, name: "preferred_lang", nullable: true, default: 'en' })
  preferredLang?: string;

  @Column({ name: "created_by" })
  createdBy?: number;

  @Column({ name: "updated_by" })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_date", default: () => "CURRENT_TIMESTAMP" })
  createdDate?: Date;

  @UpdateDateColumn({ name: "updated_date", default: () => "CURRENT_TIMESTAMP" })
  updatedDate?: Date;

  // One-to-One relationship with Users
  @OneToOne(() => Users, (user) => user.profile)
  @JoinColumn({ name: "user_id" })
  public user?: Users;
}