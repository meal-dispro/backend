import {InputType, Field, ID} from 'type-graphql';
import {Length, Min, Max, IsUrl, Equals, IsIn} from 'class-validator';
import {Recipe} from "./recipe.entity";

@InputType()
export class RecipeById implements Partial<Recipe> {
    @Field(() => ID)
    @Length(8,9)
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
    @Length(2, 128)
    @IsUrl()
    icon!: string;

    @Field(()=>String)
    @Length(5, 9)
    type!: string;

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

    @Field(()=>Number)
    @Min(0.00)
    @Max(1000.00)
    cost!: number;

    @Field(()=>Number)
    @Min(0.00)
    @Max(20)
    serves!: number;

    @Field(()=>Boolean)
    vegan?: boolean;

    @Field(()=>Boolean)
    vegetarian?: boolean;

    @Field(()=>[IngredientInput])
    ingredients!: IngredientInput[];
}

@InputType()
export class IngredientInput {
    @Field(()=>String)
    @Length(2, 255)
    name!: string;

    @Field(()=>Number)
    @Min(1)
    qty!: number;

    @Field(()=>String)
    @Length(2, 255)
    qty_typ!: string;
}
