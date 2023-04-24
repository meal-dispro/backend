import {
    Resolver,
    Mutation,
    Arg,
    Query, UseMiddleware, Ctx,
} from 'type-graphql';
import {LoginUser, User} from './user.entity';
import {LoginInput, SignupInput} from './signupInput';
import {Service} from "typedi";
import {UserService} from "./user.service";
import {isAuth} from "../../midware/auth";
import {Context} from "../../midware/context";

@Service()
@Resolver((_of) => User)
export class UserResolver {
    private readonly userService: UserService

    constructor(
        private readonly _: any,
    ) {
        if (!_) { // @ts-ignore
            return this.userService = null;
        }//testing

        this.userService = new UserService(_);
    }

    @Query(() => String)
    @UseMiddleware(isAuth)
    Me(@Ctx() {payload}: Context) {
        return `Your user id : ${payload!.sub}`;
    }

    @Query(() => User, {nullable: false})
    getUser(@Arg('id', () => Number) id: number): User {
        return this.userService.getUser(id);
    }

    @Mutation(() => LoginUser)
    async login(
        @Arg('data', () => LoginInput)
            {email}: SignupInput
    ): Promise<LoginUser> {
        return this.userService.login(email);
    }

    @Mutation(() => LoginUser)
    async signup(
        @Arg('data', () => SignupInput)
            {username, email}: SignupInput
    ): Promise<LoginUser> {
        return this.userService.signup(username, email);
    }

}