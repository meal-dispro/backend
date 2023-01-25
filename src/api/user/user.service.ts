import {Service} from "typedi";
import {LoginUser, User} from "./user.entity";
import bcrypt from "bcrypt";

import jwt from "jwt-simple";
import {getType} from "mime";
import {GenericError} from "../../midware/GenericError";
import {Prisma} from "prisma/prisma-client/scripts/default-index";

@Service()
export class UserService {
    private readonly db;

    constructor(private readonly _: any) {
        this.db = _.services.find((a: any) => a.id === 'db').value;
    }

    getUser(id: number): User{
        // throw new Error("reee")
        return this.db.user.findUnique({
            where: {
                id,
            },
        });
    };

    async signup(username: string, email: string, password: string): Promise<LoginUser> {
        const saltyBitch = await bcrypt.genSalt(Number(process.env.SALTY));

        const safepwd = await bcrypt.hash(password, saltyBitch);
        let user: User;

        try {
            user = await this.db.user.create({data: {username, email, password: safepwd}})
        }catch (e){
                // P2022: Unique constraint failed
                // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
                // @ts-ignore TODO
                if (e['code'] === 'P2002') {
                    throw new GenericError('Username or email already exists')
            }
            throw e;
        }

        const id = user.id;
        
        const data = {};

        const {JWT, RJWT} = this.genToken(id, data);

        return {user, id, JWT, RJWT};
    }

    genToken(id: number, data: { [key: string]: unknown }): {JWT: string, RJWT: string}{
        //TODO: Generate/configure NOT HARD CODED
        const secret = "//TODO:MAKEANACTUALSECRETGENERATOR";
        const jwtExp = 15*60*1000;
        const refExp = 10 * 60*60*1000;

        data['sub'] = id;
        data['exp'] = new Date().getMilliseconds() + jwtExp;

        const JWT = jwt.encode(secret, JSON.stringify(data));

        const refresh = {
            sub: id,
            exp: new Date().getMilliseconds() + refExp,
        };

        //https://stackoverflow.com/questions/27726066/jwt-refresh-token-flow
        //https://stackoverflow.com/questions/72366762/security-and-best-practices-for-auth-w-refresh-access-tokens
        //https://security.stackexchange.com/questions/119371/is-refreshing-an-expired-jwt-token-a-good-strategy
        const RJWT = jwt.encode(secret, JSON.stringify(refresh));

        return {JWT, RJWT};
    }

    async login(email: string, password: string): Promise<LoginUser>{
        const user = await this.db.user.findUnique({
            where: {
                email,
            },
        });

        const correct = user["password"];
        const allowAuth = await bcrypt.compare(password, correct);

        if(!allowAuth)
            throw new GenericError("Invalid password")

        const data = {};
        const id = user.id;

        const {JWT, RJWT} = this.genToken(id, data);

        return {user: user as User, id, JWT, RJWT};
    }
}