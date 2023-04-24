import {ObjectType, Field, ID} from 'type-graphql';
import {Ingredient} from "../recipes/recipe.entity";
import "reflect-metadata";

@ObjectType({description: 'The Shopping List Model'})
export class List{
    @Field(() => ID)
    id!: string

    @Field(() => [ListItem])
    items!: ListItem[]
}

@ObjectType({description: 'The Shopping List Item Model'})
export class ListItem{
    @Field(() => Ingredient)
    item!: Ingredient

    @Field(() => Boolean)
    checked!: boolean
}
