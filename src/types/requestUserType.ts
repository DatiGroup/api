export interface RequestUserType {
    userId: number,
    agentId: number,
    userName: string,
    email?: string,
    sessionId: string,
    externalUserId: string,
    startDateActive: Date,
    endDateActive: Date,
}