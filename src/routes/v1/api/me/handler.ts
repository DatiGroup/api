
import { FastifyRequest } from "fastify";
import { ChangePreferredLanguage, MeReponseType } from "./schemas";
import { CrudReponseType, RequestStatusEnum } from "../../../../sharedShema/response";
import { HttpError } from "@getbrevo/brevo";
import { UserProfile } from "../../../../entities/public/users.profile.entity";
import { Users } from "../../../../entities/public/users.entity";
import { UserRelationship } from "../../../../entities/public/user.relationships.entity";

export async function getMeHandler(
    request: FastifyRequest) {
    try {

        const userRepository = request.server.orm["typeorm"].getRepository(Users);

        const data = await userRepository
            .createQueryBuilder("users")
            .leftJoinAndSelect("users.profile", "profile")
            .leftJoinAndSelect("users.relationships", "relationships")
            .leftJoinAndSelect("relationships.userOrganization", "userOrganization")
            .where("users.userId = :userId", { userId: request.user.userId })
            .andWhere('now() between relationships.startDateActive and COALESCE(relationships.endDateActive, now())')
            .getOne();

        const result: MeReponseType = {
            ...data,
            memberOfOrganizations: data?.relationships?.map((rel: UserRelationship) => rel.userOrganization) || []
        }
        return result;
    } catch (error) {
        request.log.error(error, 'Failed to find user details ');
        throw request.server.httpErrors.internalServerError();

    }
}

export async function updatePreferredLanguageHandler(
    request: FastifyRequest<{ Body: ChangePreferredLanguage }>): Promise<CrudReponseType | HttpError> {

    const { languageCode } = request.body;

    const lng = languageCode.toLowerCase();

    const settings = request.agent?.parameters as any;
    const languages = settings?.languages || ['en'];
    if (!languages.includes(lng)) {
        throw request.server.httpErrors.badRequest(`Language ${lng} is not supported`);
    }

    const userRepository = request.server.orm["typeorm"].getRepository(UserProfile);

    const userProfile = await userRepository.findOne({ where: { userId: request.user.userId } });
    if (!userProfile) {
        request.log.error(`UserProfile not found for userId ${request.user.userId}`);
        throw request.server.httpErrors.notFound();
    }

    userProfile.preferredLang = lng
    await userRepository.save(userProfile);

    return { message: RequestStatusEnum.SUCCESS };


}
