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
import {MealPlan} from "./mealplan.entity";
import {GenericError} from "../../midware/GenericError";

@Service()
@Resolver((_of) => MealPlan)
export class MealplanResolver {
    private readonly mealPlanService: MealPlanService

    constructor(
        private readonly _: any,
    ) {
        this.mealPlanService = new (this._.services.find((a: any) => a.id === 'mealPlanService').value)(this._);
    }

    @Mutation(() => MealPlan)
    @UseMiddleware(isAuth, neoSess)
    async createMealPlan(@Ctx() { payload, neo }: Context): Promise<MealPlan>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.mealPlanService.createPlan(neo, payload);
    }
}