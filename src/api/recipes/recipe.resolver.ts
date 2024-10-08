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
import {Integer} from "neo4j-driver";

@Service()
@Resolver((_of) => Recipe)
export class RecipeResolver {
    private readonly recipeService: RecipeService

    constructor() {
        this.recipeService = new RecipeService();
    }

    @Query(() => [Recipe])
    @UseMiddleware(isAuth, neoSess)
    async randomRecipe(@Ctx() { payload, neo }: Context, @Arg('limit', ()=>Number) lim:number): Promise<Recipe[]> {
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3a1")
        return await this.recipeService.randomRecipe(neo, lim);
    }

    @Mutation(() => Recipe)
    @UseMiddleware(isAuth, neoSess)
    async createRecipe(@Ctx() { payload, neo, mywrite }: Context, @Arg('data', ()=>RecipeInput) recipeInput: RecipeInput): Promise<Recipe> {
        if(!neo || !payload || !mywrite) throw new GenericError("An internal error occurred 0x3c3a2")
        return await this.recipeService.createRecipe(neo, mywrite,  payload, recipeInput);
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth, neoSess)
    async deleteRecipe(@Ctx() { payload, neo }: Context, @Arg('data', ()=>RecipeById) recipeInput: RecipeById): Promise<boolean> {
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3a3")
        return await this.recipeService.deleteRecipe(neo, payload, recipeInput.id);
    }

    @Query(() => Recipe)
    @UseMiddleware(isAuth)
    async getRecipe(@Ctx() { payload, nDrive }: Context, @Arg('data', ()=>RecipeById) recipeInput: RecipeById): Promise<Recipe> {
        const neo = nDrive?.session();
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3a4");
        return await this.recipeService.getRecipe(neo, payload, recipeInput.id);
    }
}