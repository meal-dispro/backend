import {ObjectType, Field, ID} from 'type-graphql';
import {Recipe} from "../recipes/recipe.entity";
import "reflect-metadata";

@ObjectType({description: 'The MealPlan Model'})
export class MealPlan {
    @Field(() => ID)
    id!: string;

    @Field(() => Number)
    stamp!: number;

    @Field(() => String)
    uid!: string
}

@ObjectType({description: 'The Plan layout Model'})
export class PlanLayout {
    @Field(() => [[Recipe]])
    data!: Recipe[][]
}