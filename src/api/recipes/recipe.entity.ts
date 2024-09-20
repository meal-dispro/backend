import {ObjectType, Field, ID} from 'type-graphql';
import "reflect-metadata";

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

    @Field(() => String)
    type!: string;

    @Field(() => Number)
    author!: number;

    @Field(() => Boolean)
    vegan!: boolean;

    @Field(() => Boolean)
    vegetarian!: boolean;

    @Field(() => Number)
    cooktime!: number;

    @Field(() => Number)
    serves!: number;

    @Field(() => Number)
    cost!: number;

    @Field(() => [String])
    tags!: string[];

    @Field(() => [Ingredient])
    ingredients!: Ingredient[]
}

@ObjectType({description: 'The Ingredient Model'})
export class Ingredient{
    @Field(() => String)
    name!: string;

    @Field(() => String)
    qty_typ!: string;

    @Field(() => Number)
    qty!: number;
}
