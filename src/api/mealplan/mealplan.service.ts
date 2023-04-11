import {Service} from "typedi";
import {Session} from "neo4j-driver";
import {GenericError} from "../../midware/GenericError";
import {MealPlan} from "./mealplan.entity";
import {MealplanInput} from "./mealplanInput";
import {TheAlgorithm} from "../../midware/TheAlgorithm";

const logger = require('pino')()

@Service()
export class MealPlanService {

    async getMealPlan(neo: Session, payload: { [p: string]: unknown }, id:string): Promise<MealPlan>{
        //match (r:Recipe)<-[h:has]-(pl: MealPlan)<-[b:belongsTo]-(l: List)-[c:contains]->(i: Ingredient) return r,h,pl,b,l,c,i
        throw new Error('ree2');
    }

    //TODO: template: must be implemented
    async createPlan(neo: Session, payload: { [p: string]: unknown }): Promise<MealPlan> {
        const data: MealplanInput = {
            days: 7,
            meals: ['br', 'lu', 'di', 'sn'],
            restrictedAlergies: ['celary', 'mustard', 'gluten'],
            vegan: false,
            vegetarian: false,
            cost: "£££",
            // @ts-ignore
            tags: {"customisable": 10, "toasty":1, "tofu": 2, "wrap": 1, "healthy": 2, "sandwich": 2, "chez": 2},//tag:weight
            //metadata - optional, arr.length === days, arr[i].length <= meals.length
            // on monday meal 0 (br) has the constraint of being no more than 10 mins. It doesnt have null padding
            // on tuesday, meal 3 (dinner) must use tags: taco and meal 4 (snack) is ID
            // NOT TO BE IMPLEMENTED: on sunday dinner is a roast. In future, impl ability to select from users favourited recipes
            metadata: [[{"timemax": 10}],[null, null, null, {"tag": "taco"}, {"meal": "0c528a"}],[],[],[],[],[null, null, null, null, {"tag": "roast", fav:true}]],

        }

        const module = new TheAlgorithm(neo, data);
        const output = await module.getPlan();
        const mealplan = output.mealplan;
        console.log(mealplan)

        try {
            const ID = (() => {
                let n = (Math.random() * 0xfffff * 1000000).toString(16);
                return n.slice(0, 9);
            })();
            console.log(ID)

            let notEnoughMealsFlag = false;

            //building the meal plan query.
            // let query = "CREATE (pl:MealPlan {stamp: $stamp, id: $plId}) ";
            let saveMatchQuery = ""
            let saveWithQuery = "WITH "
            let saveCreateQuery = " CREATE (pl:MealPlan {stamp: $stamp, id: $plId}) ";
            const params: {[key: string]: unknown} = {stamp: new Date().getTime(), plId: ID}

            //O(n^2) TODO: limit meals to 5/day 7 days. MAX: 35 iterations
            //take in nested array of IDs, merge recipe x with plan pl, has day and meal number stored
            for(let day = 0; day < mealplan.length; day++){
                for(let meal = 0; meal < mealplan[day].length; meal++){
                    if(mealplan[day][meal] === "error"){
                        notEnoughMealsFlag = true;
                        continue;
                    }
                    const x = `${day}${meal}`;
                    saveCreateQuery += `,(pl)-[:has {day:${day}, meal:${meal}}]->(r${x})`;
                    saveWithQuery += `r${x},`;
                    saveMatchQuery += `MATCH (r${x}:Recipe {id:$rId${x}}) ${saveWithQuery.slice(0,-1)} `;
                    // query += `MERGE (r${x}:Recipe {id: $rId${x}}) MERGE (pl)-[:has {day:${day}, meal:${meal}}]->(r${x}) `;
                    params["rId"+x] = mealplan[day][meal];
                }
            }

            //then return all ingredients for processing
            const query = saveMatchQuery.slice(0,-1)+saveCreateQuery + " WITH pl MATCH (pl)-[:has]->(:Recipe)-[u:uses]->(i:Ingredient) return u,i";
            // query += " MERGE (pl)-[:has]->(:Recipe)-[u:uses]->(i:Ingredient) return u,i";

            // console.log(params)

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

            // console.log(result.records);

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

            // console.log(listData)

            const listParams: {[key: string]: unknown} = {plId: ID}
            //building query as two parts. match the current plan and all ingredients,
            // then create a new list and create a connection from plan to list and list to ingredients
            let listMatchQuery = ""
            let listWithQuery = "WITH "
            let listCreateQuery = " CREATE (l: List {id: $plId}), (l)-[:belongsTo]->(pl), ";
            for(let i = 0; i < Object.keys(listData).length; i++){
                const name = Object.keys(listData)[i];
                // listMatchQuery += ` (i${i}:Ingredient {name:$name${i}}),`
                listWithQuery += `i${i},`;
                listMatchQuery += `MATCH (i${i}:Ingredient {name:$name${i}}) ${listWithQuery.slice(0,-1)} `;


                listCreateQuery += `(l)-[:contains {qty: $qty${i}, checked: false}]->(i${i}),`
                listParams['name'+i] = name;
                listParams['qty'+i] = listData[name];
            }

            listWithQuery += `pl`;
            listMatchQuery += `MATCH (pl: MealPlan {id: $plId}) ${listWithQuery}  `

            // console.log(listParams)

            const listResult = await neo.run(
                listMatchQuery.slice(0,-1)+listCreateQuery.slice(0, -1) + " RETURN l", listParams
            )

            // console.log(listResult)

            //TODO something here
            //TODO return flag

            throw new GenericError(`flag: ${notEnoughMealsFlag}`)
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while creating a meal plan.");
        } finally {
            await neo.close()
        }

    }

}