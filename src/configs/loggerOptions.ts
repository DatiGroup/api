
import { FastifyRequest } from "fastify";
import { LoggerOptions } from "pino";

export const LoggerConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  name: "platform-api",
  // Keep raw pino output for Kubernetes/Fluent Bit pipelines (single-line JSON).
  transport: process.env.NODE_ENV === 'development_locally' ? {
    targets: [
      {
        target: 'pino-pretty',//'pino/file',
        options: { destination: 1 }
      }
    ]
  } : undefined,
  timestamp: () => {
    const dateString = new Date(Date.now()).toISOString()
    return `,"@timestamp":"${dateString}"`
  },
  redact: {
    censor: '***',
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.file',
      'req.body.newPassword',
      'req.body.token',
      'req.body.otpCode',
      'req.body.repeatPassword',
    ]
  },
  serializers: {
    req: function (request: FastifyRequest) {
      const shouldLogBody = true;
      return {
        method: request.method,
        url: request.raw.url,
        routeUrl: request.routeOptions.url,
        headers: request.headers,
        body: shouldLogBody ? request?.body : undefined,
        hostname: request.hostname,
        remoteAddress: request.ip,
        remotePort: request.socket?.remotePort
      }
    },
    res: function (reply: any) {
      return {
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime
      }
    }
  }
}
