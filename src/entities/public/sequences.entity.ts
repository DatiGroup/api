import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum SequenceType {
  OBJECT = "OBJECT",
  FND = "FND"
}

@Entity({ name: 'sequences', schema: 'public' })
export class Sequences {
  @PrimaryGeneratedColumn({ name: "sequence_id" })
  sequenceId?: number;

  @Column("int", { name: "agent_id" })
  agentId!: number;

  @Column("varchar", { length: 30, name: "type" })
  sequenceType!: SequenceType;

  @Column("varchar", { length: 3, name: "prefix" })
  prefix!: string;

  @Column("int", { name: "value" })
  value!: number;

  @Column("int", { name: "length" })
  length!: number;

}