import {Field, ID, InputType} from "type-graphql";
import {Length} from "class-validator";
import {List, ListItem} from "./list.entity";
import {Ingredient} from "../recipes/recipe.entity";


@InputType()
export class GetList implements Partial<List> {
    @Field(() => ID)
    @Length(9,9)
    id!: string;
}

@InputType()
export class CheckItem implements Partial<ListItem> {
    @Field(() => ID)
    @Length(9,9)
    id!: string;

    @Field(() => String)
    name!: string;

    @Field(() => Boolean)
    checked!: boolean
}

@InputType()
export class AddItem implements Partial<Ingredient> {
    @Field(() => ID)
    @Length(9,9)
    id!: string;

    @Field(() => String)
    name!: string;

    @Field(() => Number)
    qty!: number
}

@InputType()
export class RemoveItem implements Partial<Ingredient> {
    @Field(() => ID)
    @Length(9,9)
    id!: string;

    @Field(() => String)
    name!: string;
}