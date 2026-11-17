import { DataSource } from 'typeorm'
import { FastifyInstance } from 'fastify'
import { UserDevices } from '../entities/public/devices.entity'
import { DeviceType } from '../routes/v1/api/auth/schema'

export class UserDevicesService {
  constructor(
    protected readonly orm: DataSource,
    protected readonly fastify: FastifyInstance,
  ) {}

  private repository = this.orm.getRepository(UserDevices)

  public async processDevice({
    userId,
    device,
    ip,
  }: {
    userId: number
    device: DeviceType
    ip: string
  }) {
    let userDevices: UserDevices = new UserDevices()

    const existingDevice = await this.repository
      .createQueryBuilder('devices')
      .where('devices.userId = :userId', { userId: userId })
      .getOne()

    if (
      existingDevice?.endDateActive &&
      existingDevice.endDateActive <= new Date()
    ) {
      const error = new Error('Device is disabled', {
        cause: 'errors.devices.deviceDisabled',
      }) as any
      error.showToUser = true

      throw error
    }

    if (existingDevice) {
      userDevices = existingDevice
      userDevices.updatedBy = userId
    } else {
      userDevices.browser = device?.browser?.toLowerCase() ?? 'UNKNOWN'
      userDevices.platform = device?.platform?.toLowerCase() ?? 'UNKNOWN'
      userDevices.fingerprint = device?.hash
      userDevices.createdBy = userId
      userDevices.updatedBy = userId
    }

    userDevices.ip_address = ip
    userDevices.userId = userId

    return await this.repository.save(userDevices)
  }

  public async getUserDevices(userId: number) {
    return await this.repository
      .createQueryBuilder('devices')
      .where('devices.userId = :userId', { userId })
      .andWhere(
        '(devices.endDateActive > CURRENT_DATE or devices.endDateActive  is null ) ',
      )
      .getMany()
  }
}
