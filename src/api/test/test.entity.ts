import {ObjectType, Field, ID} from 'type-graphql';

@ObjectType({description: 'The test model'})
export class Test {
    @Field(() => ID)
    id!: number;
}
