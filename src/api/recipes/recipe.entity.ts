import {ObjectType, Field, ID} from 'type-graphql';

@ObjectType({description: 'The Recipe Model'})
export class Recipe {
    @Field(() => ID)
    id!: string;

    @Field(() => String)
    title!: string;

    @Field(() => String)
    description!: string;

    @Field(() => String)
    link!: string;

    @Field(() => String)
    icon!: string;

    @Field(() => Number)
    author!: number;

    @Field(() => Boolean)
    vegan!: boolean;

    @Field(() => Number)
    cooktime!: number;

    @Field(()=> [Ingredient])
    ingredients!: [Ingredient]
}

@ObjectType({description: 'The Ingredient Model'})
export class Ingredient{
    @Field(() => String)
    name!: string;

    @Field(() => Number)
    qty!: number;
}
