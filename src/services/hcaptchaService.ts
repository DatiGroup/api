import axios from "axios";
import { FastifyInstance } from "fastify";


export class HCaptchaService {

    public readonly enabled: boolean;

    private baseUrl: string = 'https://api.hcaptcha.com/siteverify'

    constructor(protected readonly fastify: FastifyInstance) {
        this.enabled = !!this.fastify.config.HCAPTCHA_SECRET;
    }

    private async callVerify<T = any>(token: string): Promise<T> {

        const response = await axios.post(this.baseUrl,
            new URLSearchParams({
                response: token,
                "secret": this.fastify.config.HCAPTCHA_SECRET,
            }));

        return response.data;

    }

    public async verifyHcaptcha(token: string): Promise<boolean> {
        if (!token) {
            throw this.fastify.httpErrors.badRequest("hRecaptchaToken token is required");
        }

        if (!this.enabled) {
            return true;
            //throw this.fastify.httpErrors.badRequest("hRecaptcha is not enabled");
        }

        const hcaptchaResult = await this.callVerify(token);
        if (!hcaptchaResult?.success) {
            console.log('hcaptchaResult:', hcaptchaResult);
        }

        return hcaptchaResult?.success === true;

    }
}
