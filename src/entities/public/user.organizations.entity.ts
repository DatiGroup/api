import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { UserRelationship } from "./user.relationships.entity";
import { Users } from "./users.entity";

@Entity({ name: "user_organizations", schema: "public" })
export class UserOrganization {
    @PrimaryGeneratedColumn({ name: "user_organization_id" })
    userOrganizationId!: number;

    @Column({ name: "root_user_id", type: "integer" })
    rootUserId!: number;

    @Column({ name: "name", type: "varchar", nullable: false })
    name!: string;

    @Column({ name: "registration_number", type: "varchar", nullable: true })
    registrationNumber?: string;

    @Column({ name: "country", type: "varchar", nullable: true })
    country?: string;

    @Column({ name: "contact_name", type: "varchar", length: 50, nullable: true })
    contactName?: string;

    @Column({ name: "contact_last_name", type: "varchar", length: 50, nullable: true })
    contactLastName?: string;

    @Column({ name: "contact_email", type: "varchar", length: 100, nullable: true })
    contactEmail?: string;

    @Column({ name: "start_date_active", type: "timestamptz" })
    startDateActive!: Date;

    @Column({ name: "end_date_active", type: "timestamptz", nullable: true })
    endDateActive?: Date;

    @Column({ name: "created_by", type: "integer" })
    createdBy!: number;

    @Column({ name: "updated_by", type: "integer" })
    updatedBy!: number;

    @CreateDateColumn({ name: "created_date", default: () => "CURRENT_TIMESTAMP" })
    createdDate!: Date;

    @UpdateDateColumn({ name: "updated_date", default: () => "CURRENT_TIMESTAMP" })
    updatedDate!: Date;

    @OneToMany(() => UserRelationship, rel => rel.userOrganization)
    relationships: UserRelationship[];

    @ManyToOne(() => Users)
    @JoinColumn({ name: "root_user_id", referencedColumnName: "userId" })
    rootUser: Users;
}