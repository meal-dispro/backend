import {
    Resolver,
    Mutation,
    Arg,
    Query,
} from 'type-graphql';
import { User } from './user.entity';
import { UserInput } from './user.input';
import {Service} from "typedi";

@Service()
@Resolver((_of) => User)
export class UserResolver {
    private readonly userService

    constructor(
        private readonly _: any,
    ) {
        this.userService = new (this._.services.find((a: any) => a.id === 'userService').value)(this._);
    }


    @Query(() => User, { nullable: false })
    getUser(@Arg('id', ()=> Number) id: number): User {
        return this.userService.getUser(id);
    }

    @Mutation(() => User)
    createUser(
        @Arg('data', ()=>UserInput)
            { username, email }: UserInput
    ): User {
//TODO
        return {id: -1, username, email};
    }

}