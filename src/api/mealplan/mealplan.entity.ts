import {ObjectType, Field, ID} from 'type-graphql';
import {Ingredient, Recipe} from "../recipes/recipe.entity";

@ObjectType({description: 'The MealPlan Model'})
export class MealPlan {
    @Field(() => ID)
    id!: string;

    @Field(() => [Recipe])
    recipes!: [Recipe];

    @Field(() => List)
    list!: List
}

@ObjectType({description: 'The Shopping List Model'})
export class List{
    @Field(() => [Ingredient])
    items!: [Ingredient]
}
