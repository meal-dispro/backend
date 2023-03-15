import {
    Resolver,
    Mutation,
    Arg,
    Query, UseMiddleware, Ctx,
} from 'type-graphql';
import {Service} from "typedi";
import {RecipeService} from "./recipe.service";
import {isAuth} from "../../midware/auth";
import {Context} from "../../midware/context";
import {neoSess} from "../../midware/neoSess";
import {Recipe} from "./recipe.entity";
import {GenericError} from "../../midware/GenericError";
import {RecipeById, RecipeInput} from "./recipeInput";

@Service()
@Resolver((_of) => Recipe)
export class RecipeResolver {
    private readonly recipeService: RecipeService

    constructor(
        private readonly _: any,
    ) {
        this.recipeService = new (this._.services.find((a: any) => a.id === 'recipeService').value)(this._);
    }

    @Mutation(() => Recipe)
    @UseMiddleware(isAuth, neoSess)
    async createRecipe(@Ctx() { payload, neo }: Context, @Arg('data', ()=>RecipeInput) recipeInput: RecipeInput): Promise<Recipe> {
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.recipeService.createRecipe(neo, payload, recipeInput);
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth, neoSess)
    async deleteRecipe(@Ctx() { payload, neo }: Context, @Arg('data', ()=>RecipeById) recipeInput: RecipeById): Promise<boolean> {
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.recipeService.deleteRecipe(neo, payload, recipeInput.id);
    }

    @Query(() => Recipe)
    @UseMiddleware(isAuth, neoSess)
    async getRecipe(@Ctx() { payload, neo }: Context, @Arg('data', ()=>RecipeById) recipeInput: RecipeById): Promise<Recipe> {
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.recipeService.getRecipe(neo, payload, recipeInput.id);
    }
}