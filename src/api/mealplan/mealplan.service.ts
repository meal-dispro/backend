import {Service} from "typedi";
import {Session} from "neo4j-driver";
import {GenericError} from "../../midware/GenericError";
import {MealPlan} from "./mealplan.entity";
import {MealplanInput} from "./mealplanInput";

const logger = require('pino')()

@Service()
export class MealPlanService {

    async getMealPlan(neo: Session, payload: { [p: string]: unknown }, id:string): Promise<MealPlan>{
        //match (r:Recipe)<-[h:has]-(pl: MealPlan)<-[b:belongsTo]-(l: List)-[c:contains]->(i: Ingredient) return r,h,pl,b,l,c,i
        throw new Error('ree2');
    }

    //TODO: template: must be implemented
    async createPlan(neo: Session, payload: { [p: string]: unknown }, data: MealplanInput): Promise<MealPlan> {

        const thisIsNotAVariableItsJustMePuttingAllTheDataInOnePlace = {
            days: 7,
            meals: ['br','lu','lu','di','sn'],
            restrictedAlergies: ['celary', 'mustard', 'gluten'],
            vegan: true,
            vegetarian: true,
            minCost: 0,
            maxCost: 1000,
            tags: {"im-a-tag": 10, "test2":5, "test3": 2, "boop": 1},//tag:weight
            //metadata - optional, arr.length === days, arr[i].length <= meals.length
            // on monday meal 0 (br) has the constraint of being no more than 10 mins. It doesnt have null padding
            // on tuesday, meal 3 (dinner) must use tags: taco and meal 4 (snack) is ID
            // NOT TO BE IMPLEMENTED: on sunday dinner is a roast. In future, impl ability to select from users favourited recipes
            metadata: [[{"timemax": 10}],[null, null, null, {"tag": "taco"}, {"meal": "0c528a"}],[],[],[],[],[null, null, null, null, {"tag": "roast", fav:true}]],

        }

        //TOPSIS: updates data.tags weights, not database tag count weight

        const recipeModifier: {type:string, vegan?:boolean} = {type: "lunch"}
        if(true) //if vegan, else do nothing because (not vegan == vegan || not vegan)
            recipeModifier['vegan'] = true;

        //TODO: data filter layer
        // allergy requirements, as well as other diet filters. It will also filter out meals way out of the price range and (average cooking time)?
        // -                        match type and restrictions
        //         MATCH (n: Recipe {type: "lunch", vegan: true})
        //              ensure cost is in range                     filter out ingredients, is this efficient??
        //         WHERE n.cost > 0 AND n.cost < 1000 AND NOT ((n)-[:uses]->(:Ingredient {name: "stock"}))
        // -            calculate weightings based on input tags and order
        //         WITH size(apoc.coll.intersection(n.tags, ["im-a-tag", "test2"])) as weight, n
        //         ORDER BY weight DESC
        // -            need to change the limit based on number of meal type per day
        //         LIMIT 35
        // -            maybe remove this? or should i repeat dishes if there arent enough
        //         WHERE weight > 0
        //         RETURN { properties: properties(n), weight: weight }
        /* -
                MATCH (n: Recipe {type: "lunch", vegan: true})
                WHERE n.cost > 0 AND n.cost < 1000 AND NOT ((n)-[:uses]->(:Ingredient {name: "stock"}))
                WITH size(apoc.coll.intersection(n.tags, ["im-a-tag", "test2"])) as weight, n
                ORDER BY weight DESC
                LIMIT 35
                WHERE weight > 0
                RETURN { properties: properties(n), weight: weight }
         */


        //TODO: TOPSIS ALGORITHM LAYER

        //output: the decided mealplan in the format:
        /*+
        [
          [day1Meal1, day1Meal2, day1Meal3, ...],
          [day2Meal1, day2Meal2, day2Meal3, ...],
          ....
          ....
          ....
          ....
          ....
        ]
         */
        const output = [
            ["44f7a4149"],
            ["16db62e67"],
            ["124b67621"],
            ["dbe0a4271"],
            ["70e67284a"],
        ]


        try {
            const ID = (() => {
                let n = (Math.random() * 0xfffff * 1000000).toString(16);
                return n.slice(0, 9);
            })();


            //building the meal plan query.
            let query = "CREATE (pl:MealPlan {stamp: $stamp, id: $plId}) ";
            const params: {[key: string]: unknown} = {stamp: new Date().getTime(), plId: ID}

            //O(n^2) TODO: limit meals to 5/day 7 days. MAX: 35 iterations
            //take in nested array of IDs, merge recipe x with plan pl, has day and meal number stored
            for(let day = 0; day < output.length; day++){
                for(let meal = 0; meal < output[day].length; meal++){
                    const x = `${day}${meal}`;
                    query += `MERGE (r${x}:Recipe {id: $rId${x}}) MERGE (pl)-[:has {day:${day}, meal:${meal}}]->(r${x}) `;
                    params["rId"+x] = output[day][meal];
                }
            }

            //then return all ingredients for processing
            query += "MERGE (pl)-[:has]->(:Recipe)-[u:uses]->(i:Ingredient) return u,i";

            //TODO: look into refactoring to match with commas i think its more efficient

            /** example
             CREATE (pl:MealPlan {stamp: $stamp, id: $plId})
             MERGE (r1:Recipe {id:"44f7a4149"})
             MERGE (r2:Recipe {id:"16db62e67"})
             MERGE (r3:Recipe {id:"124b67621"})
             MERGE (r4:Recipe {id:"dbe0a4271"})
             MERGE (r5:Recipe {id:"70e67284a"})
             MERGE (pl)-[:has {day:0,meal:0}]->(r1)
             MERGE (pl)-[:has {day:1,meal:0}]->(r2)
             MERGE (pl)-[:has {day:2,meal:0}]->(r3)
             MERGE (pl)-[:has {day:3,meal:0}]->(r4)
             MERGE (pl)-[:has {day:4,meal:0}]->(r5)
             MERGE (pl)-[:has]->(:Recipe)-[u:uses]->(i:Ingredient) return u,i
             */

            const result = await neo.run(
                query, params
            )

            //now we have created the meal plan, we need to create the shopping list
            const listData: {[key: string]: number} = {};
            //total up the final quantities
            for(let i = 0; i < result.records.length; i++){
                const dat = result.records[i];
                const qty = dat.get(0).properties.qty;
                const name = dat.get(1).properties.name;

                //get ingredient and increase or set required qty
                if(listData[name])
                    listData[name] += qty
                else
                    listData[name] = qty
            }

            const listParams: {[key: string]: unknown} = {plId: ID}
            //building query as two parts. match the current plan and all ingredients,
            // then create a new list and create a connection from plan to list and list to ingredients
            let listMatchQuery = "MATCH (pl: MealPlan {id: $plId}), "
            let listCreateQuery = "CREATE (l: List {id: $plId}), (l)-[:belongsTo]->(pl), ";
            for(let i = 0; i < Object.keys(listData).length; i++){
                const name = Object.keys(listData)[i];
                listMatchQuery += ` (i${i}:Ingredient {name:$name${i}}),`
                listCreateQuery += `(l)-[:contains {qty: $qty${i}, checked: false}]->(i${i}),`
                listParams['name'+i] = name;
                listParams['qty'+i] = listData[name];
            }

            const listResult = await neo.run(
                listMatchQuery.slice(0,-1)+listCreateQuery.slice(0, -1), listParams
            )

            //TODO something here

            throw new GenericError("ree")
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while creating a meal plan.");
        } finally {
            await neo.close()
        }

    }

}