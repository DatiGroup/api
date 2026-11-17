import { z } from "zod"

export interface PaginateResults<T> {
  list: T[];
  count: number;
}

export enum SortType {
  ASC = "ASC",
  DESC = "DESC",
}

export enum OperationType {
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export const paginateParams = z.object({
  skip: z.number(),
  take: z.number(),
  sort: z.nativeEnum(SortType),
  orderBy: z.string(),
  filter: z.string()
});

export type PaginateParams = z.infer<typeof paginateParams>;

export const datePaginationParams = z.object({
  startDateActive: z.date(),
  endDateActive: z.date()
});

export type DatePaginateParams = z.infer<typeof datePaginationParams>;

export const statusReponseObject = z.object({
  status: z.string(),
  id: z.number().optional()
});


export const note = z.object({
  noteId: z.number().optional(),
  note: z.string().optional(),
  editable: z.boolean().optional(),
  description: z.string().optional(),
  attribute1: z.string().optional(),
  attribute2: z.string().optional(),
  attribute3: z.string().optional(),
  attribute4: z.string().optional(),
  attribute5: z.string().optional(),
  attribute6: z.string().optional(),
  attribute7: z.string().optional(),
  attribute8: z.string().optional(),
  attribute9: z.string().optional(),
  attribute10: z.string().optional(),
  attribute11: z.string().optional(),
  attribute12: z.string().optional(),
  attribute13: z.string().optional(),
  attribute14: z.string().optional(),
  attribute15: z.string().optional(),
  createDate: z.date().optional()
});

export type NoteSchema = z.infer<typeof note>;

export const notes = z.object({
  count: z.number(),
  list: z.array(note)
})

export type NotesSchema = z.infer<typeof notes>;

export const attachment = z.object({
  attachmentId: z.number().optional(),
  editable: z.boolean().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  description: z.string().optional(),
  attribute1: z.string().optional(),
  attribute2: z.string().optional(),
  attribute3: z.string().optional(),
  attribute4: z.string().optional(),
  attribute5: z.string().optional(),
  attribute6: z.string().optional(),
  attribute7: z.string().optional(),
  attribute8: z.string().optional(),
  attribute9: z.string().optional(),
  attribute10: z.string().optional(),
  attribute11: z.string().optional(),
  attribute12: z.string().optional(),
  attribute13: z.string().optional(),
  attribute14: z.string().optional(),
  attribute15: z.string().optional(),
  createDate: z.date().optional()
});

export type AttachmentSchema = z.infer<typeof attachment>;

export const attachments = z.object({
  count: z.number(),
  list: z.array(attachment)
})

export type AttachmentsSchema = z.infer<typeof attachments>;

export const relationship = z.object({
  relationshipId: z.number().optional(),
  subjectId: z.number().optional(),
  objectId: z.number().optional(),
  comments: z.string().optional(),
  createDate: z.date().optional()
});

export type RelationshipSchema = z.infer<typeof relationship>;

export const relationships = z.object({
  count: z.number(),
  list: z.array(relationship)
})

export type RelationshipsSchema = z.infer<typeof relationships>;

export const chatId = z.object({
  chatId: z.number(),
})

export type ChatIdSchema = z.infer<typeof chatId>;



export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});


export type IdParamsType = z.infer<typeof idParamsSchema>;