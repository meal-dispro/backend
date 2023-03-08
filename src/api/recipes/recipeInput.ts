import {InputType, Field, ID} from 'type-graphql';
import { Length, Min, Max, IsUrl} from 'class-validator';
import {Recipe} from "./recipe.entity";

@InputType()
export class RecipeById implements Partial<Recipe> {
    @Field(() => ID)
    @Length(9,9)
    id!: string;
}

@InputType()
export class RecipeInput implements Partial<Recipe> {
    @Field(()=>String)
    @Length(2, 255)
    title!: string;

    @Field(()=>String)
    @Length(2, 128)
    @IsUrl()
    link!: string;

    @Field(()=>String)
    @Length(0, 1024)
    description!: string;

    @Field(()=>[String])
    @Length(0, 64)
    tags!: [string];

    @Field(()=>Number)
    @Min(1)
    @Max(60 * 24)
    cooktime!: number;

    @Field(()=>[IngredientInput])
    ingredients!: [IngredientInput];
}

@InputType()
export class IngredientInput {
    @Field(()=>String)
    @Length(2, 255)
    name!: string;

    @Field(()=>Number)
    @Min(1)
    qty!: number;

}
