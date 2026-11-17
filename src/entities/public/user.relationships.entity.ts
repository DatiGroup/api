import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { UserOrganization } from "./user.organizations.entity";
import { Users } from "./users.entity";

@Entity({ name: "user_relationships", schema: "public" })
export class UserRelationship {
    @PrimaryGeneratedColumn({ name: "user_relationships_id" })
    userRelationshipsId!: number;

    @Column({ name: "user_id", type: "integer" })
    userId!: number;

    @Column({ name: "user_organization_id", type: "integer" })
    userOrganizationId!: number;

    @Column({ name: "start_date_active", type: "timestamptz" })
    startDateActive!: Date;

    @Column({ name: "end_date_active", type: "timestamptz", nullable: true })
    endDateActive?: Date;

    @Column({ name: "created_by", type: "integer" })
    createdBy!: number;

    @Column({ name: "updated_by", type: "integer" })
    updatedBy!: number;

    @CreateDateColumn({ name: "created_date", default: () => "CURRENT_TIMESTAMP" })
    createdDate?: Date;

    @UpdateDateColumn({ name: "updated_date", default: () => "CURRENT_TIMESTAMP" })
    updatedDate?: Date;

    @ManyToOne(() => UserOrganization, org => org.relationships)
    @JoinColumn({ name: "user_organization_id", referencedColumnName: "userOrganizationId" })
    userOrganization: UserOrganization;

    @ManyToOne(() => Users, user => user.relationships)
    @JoinColumn({ name: "user_id", referencedColumnName: "userId" })
    public user: Users;
}