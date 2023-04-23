import {
    Resolver,
    Mutation,
    Arg,
    Query, UseMiddleware, Ctx,
} from 'type-graphql';
import {Service} from "typedi";
import {MealPlanService} from "./mealplan.service";
import {isAuth} from "../../midware/auth";
import {Context} from "../../midware/context";
import {neoSess} from "../../midware/neoSess";
import {MealPlan, PlanLayout} from "./mealplan.entity";
import {GenericError} from "../../midware/GenericError";

@Service()
@Resolver((_of) => MealPlan)
export class MealplanResolver {
    private readonly mealPlanService: MealPlanService

    constructor() {
        this.mealPlanService = new MealPlanService();
    }

    @Mutation(() => String)
    @UseMiddleware(isAuth, neoSess)
    async createMealPlan(@Ctx() { payload, neo }: Context, /*@Arg('data', ()=>MealplanInput) mealplanInput: MealplanInput*/): Promise<string>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.mealPlanService.createPlan(neo, payload);//mealplanInput);
    }

    @Query(() => [MealPlan])
    @UseMiddleware(isAuth, neoSess)
    async getUserMealPlans(@Ctx() { payload, neo }: Context): Promise<MealPlan[]>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.mealPlanService.getMealPlansUser(neo, payload);//mealplanInput);
    }

    @Query(() => PlanLayout)
    @UseMiddleware(isAuth, neoSess)
    async getSinglePlanMeals(@Ctx() { payload, neo }: Context, @Arg('id', ()=>String) id: string): Promise<PlanLayout>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.mealPlanService.getMealPlanRecipes(neo, payload, id);
    }

}