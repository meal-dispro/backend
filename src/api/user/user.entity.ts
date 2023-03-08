import {ObjectType, Field, ID} from 'type-graphql';

@ObjectType({description: 'The User model'})
export class User {
    @Field(() => ID)
    id!: number;

    @Field(() => String)
        // @Property({ required: true })
    username!: String;

    @Field(() => String)
        // @Property({ required: true })
    email!: String;
}

@ObjectType({description: 'The User model'})
export class LoginUser {
    @Field(() => ID)
    id!: number;

    @Field(() => User)
    user!: User;
}
