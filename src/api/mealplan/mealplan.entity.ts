import {ObjectType, Field, ID} from 'type-graphql';
import {Recipe} from "../recipes/recipe.entity";
import {List} from "../list/list.entity";

@ObjectType({description: 'The MealPlan Model'})
export class MealPlan {
    @Field(() => ID)
    id!: string;

    @Field(() => [Recipe])
    recipes!: [Recipe];

    @Field(() => List)
    list!: List
}
