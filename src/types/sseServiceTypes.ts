export enum SSEEventEnum {
  INIT = 'init',
  DATA = 'data',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  UNKNOWN = 'unknown',
}

export interface SSEDataInterface<T = any> {
  type: SSEEventEnum
  data?: T
  message?: string
  timestamp?: Date
}
