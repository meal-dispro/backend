import {Service} from "typedi";
import {Session} from "neo4j-driver";
import {GenericError} from "../../midware/GenericError";
import {MealPlan, PlanLayout} from "./mealplan.entity";
import {MealplanInput} from "./mealplanInput";
import {TheAlgorithm} from "../../midware/TheAlgorithm";
import {Recipe} from "../recipes/recipe.entity";

const logger = require('pino')()

@Service()
export class MealPlanService {

    async getMealPlanRecipes(neo: Session, payload: { [p: string]: unknown }, id: string): Promise<PlanLayout> {
        const s = 'MATCH (pl: MealPlan {id:$id})-[h:has]->(r:Recipe) RETURN pl,h,r';
        try {

            const result = await neo.run(
                s, {id}
            )
            //
            // const ret: {d0: Recipe[], d1: Recipe[], d2: Recipe[], d3: Recipe[], d4: Recipe[], d5: Recipe[], d6: Recipe[]} = {
            //     d0: [],
            //     d1: [],
            //     d2: [],
            //     d3: [],
            //     d4: [],
            //     d5: [],
            //     d6: [],
            // };

            const ret:Recipe[][] = [[],[],[],[],[],[],[]];
            for(let i = 0; i < result.records.length; i++){
                const singleRecord = result.records[i]
                const h = singleRecord.get(1).properties
                const r = singleRecord.get(2).properties
                r.ingredients = [];
                r._mealno = Number(h.meal);
                ret[h.day].push(r);
            }

            for(let i = 0; i < 7; i++){
                // @ts-ignore -- temp value _mealno
                ret[i].sort((a, b) => a._mealno - b._mealno);
            }
            return {data:ret};
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while creating a new recipe.");
        } finally {
            await neo.close()
        }

    }

    async getMealPlansUser(neo: Session, payload: { [p: string]: unknown }): Promise<MealPlan[]> {
        const s = 'MATCH (r:MealPlan {uid:$uid}) RETURN r ORDER BY r.stamp DESC LIMIT 20';
        try {

            const result = await neo.run(
                s, {uid: payload!.sub}
            )

            const ret = [];
            for(let i = 0; i < result.records.length; i++){
                const singleRecord = result.records[i]
                ret.push(singleRecord.get(0).properties)
            }

            return ret;
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while creating a new recipe.");
        } finally {
            await neo.close()
        }
    }

    //TODO: template: must be implemented
    async createPlan(neo: Session, payload: { [p: string]: unknown }): Promise<string> {
        const data: MealplanInput = {
            days: 7,
            meals: ['br', 'lu', 'di', 'sn'],
            restrictedAlergies: ['celary', 'mustard', 'gluten'],
            vegan: false,
            vegetarian: false,
            cost: "£££",
            // @ts-ignore
            tags: {'bulkinsertstresstest': 1}, //{"customisable": 10, "toasty":1, "tofu": 2, "wrap": 1, "healthy": 2, "sandwich": 2, "chez": 2},//tag:weight
            //metadata - optional, arr.length === days, arr[i].length <= meals.length
            // in future: on monday meal 0 (br) has the constraint of being no more than 10 mins. It doesnt have null padding
            // on tuesday, meal 3 (dinner) must use tags: taco and meal 4 (snack) is ID
            // NOT TO BE IMPLEMENTED: on sunday dinner is a roast. In future, impl ability to select from users favourited recipes
            metadata: [],//[[],[null, null, {"tag": "taco"}, {"meal": "64c705243"}],[],[],[],[],[null, null, {"tag": "roast", fav:true}]],

        }

        const module = new TheAlgorithm(neo, data);
        const mealplan = await module.getPlan();
        console.log(mealplan)

        try {
            const ID = (() => {
                let n = (Math.random() * 0xfffff * 1000000).toString(16);
                return n.slice(0, 9);
            })();
            console.log(ID)

            //building the meal plan query.
            let saveMatchQuery = "MATCH "
            let saveWithQuery = "WITH "
            let saveCreateQuery = " CREATE (pl:MealPlan {stamp: $stamp, id: $plId, uid:$uid}) ";
            const params: { [key: string]: unknown } = {stamp: new Date().getTime(), plId: ID, uid: payload!.sub}

            //O(n^2) TODO: limit meals to 5/day 7 days. MAX: 35 iterations
            //take in nested array of IDs, merge recipe x with plan pl, has day and meal number stored
            for (let day = 0; day < mealplan.length; day++) {
                for (let meal = 0; meal < mealplan[day].length; meal++) {
                    if (mealplan[day][meal] === "error") {
                        throw new GenericError("The meal plan was unable to be created. This could be due to meal requirements that are not compatible");
                    }
                    const x = `${day}${meal}`;
                    saveCreateQuery += `,(pl)-[:has {day:${day}, meal:${meal}}]->(r${x})`;
                    saveWithQuery += `r${x},`;
                    saveMatchQuery += `(r${x}:Recipe {id:$rId${x}}),`
                    params["rId" + x] = mealplan[day][meal];
                }
            }

            //then return all ingredients for processing
            const query = saveMatchQuery.slice(0, -1) + saveCreateQuery + " WITH pl MATCH (pl)-[:has]->(:Recipe)-[u:uses]->(i:Ingredient) return u,i";

            /** example
             MATCH (r1:Recipe {id:"44f7a4149"}),
             (r2:Recipe {id:"16db62e67"}),
             (r3:Recipe {id:"124b67621"}),
             (r4:Recipe {id:"dbe0a4271"}),
             (r5:Recipe {id:"70e67284a"})
             CREATE (pl:MealPlan {stamp: $stamp, id: $plId}),
             (pl)-[:has {day:0,meal:0}]->(r1),
             (pl)-[:has {day:1,meal:0}]->(r2),
             (pl)-[:has {day:2,meal:0}]->(r3),
             (pl)-[:has {day:3,meal:0}]->(r4),
             (pl)-[:has {day:4,meal:0}]->(r5)
             WITH pl
             MATCH (pl)-[:has]->(:Recipe)-[u:uses]->(i:Ingredient) return u,i
             */

            const result = await neo.run(
                query, params
            )

            //now we have created the meal plan, we need to create the shopping list
            const listData: { [key: string]: number } = {};
            //total up the final quantities
            for (let i = 0; i < result.records.length; i++) {
                const dat = result.records[i];
                const qty = dat.get(0).properties.qty;
                const name = dat.get(1).properties.name;

                //get ingredient and increase or set required qty
                if (listData[name])
                    listData[name] += qty
                else
                    listData[name] = qty
            }

            // console.log(listData)

            const listParams: { [key: string]: unknown } = {plId: ID, uid: payload!.sub}
            //building query as two parts. match the current plan and all ingredients,
            // then create a new list and create a connection from plan to list and list to ingredients
            let listMatchQuery = "MATCH "
            let listWithQuery = "WITH "
            let listCreateQuery = " CREATE (l: List {id: $plId, uid:$uid}), (l)-[:belongsTo]->(pl), ";
            for (let i = 0; i < Object.keys(listData).length; i++) {
                const name = Object.keys(listData)[i];
                listWithQuery += `i${i},`;
                listMatchQuery += `(i${i}:Ingredient {name:$name${i}}), `

                listCreateQuery += `(l)-[:contains {qty: $qty${i}, checked: false}]->(i${i}),`
                listParams['name' + i] = name;
                listParams['qty' + i] = listData[name];
            }

            listMatchQuery += `(pl: MealPlan {id: $plId}) `

            const listResult = await neo.run(
                listMatchQuery + listCreateQuery.slice(0, -1), listParams
            )

            return ID;
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while creating a meal plan.");
        } finally {
            await neo.close()
        }

    }

}