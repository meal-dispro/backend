import {Service} from "typedi";
import {Session} from "neo4j-driver";
import {GenericError} from "../../midware/GenericError";
import {MealPlan} from "./mealplan.entity";

const logger = require('pino')()

@Service()
export class MealPlanService {

    //TODO: template: must be implemented
    async createPlan(neo: Session, payload: { [p: string]: unknown }, data = undefined): Promise<MealPlan> {

        //TODO: data filter layer

        //TODO: TOPSIS ALGORITHM LAYER

        //output: the decided mealplan in the format:
        /*
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

            let query = "CREATE (pl:MealPlan {stamp: $stamp, id: $plId}) ";
            const params: {[key: string]: unknown} = {stamp: new Date().getTime(), plId: ID}

            //O(n^2) TODO: limit meals to 5/day 7 days. MAX: 35 iterations
            for(let day = 0; day < output.length; day++){
                for(let meal = 0; meal < output[day].length; meal++){
                    const x = `${day}${meal}`;
                    query += `MERGE (r${x}:Recipe {id: $rId${x}}) MERGE (pl)-[:has {day:${day}, meal:${meal}}]->(r${x}) `;
                    params["rId"+x] = output[day][meal];
                }
            }

            query += "MERGE (pl)-[:has]->(_r:Recipe)-[u:uses]->(i:Ingredient) return _r,u,i";

            /**
             CREATE (pl:MealPlan {date: 1601723642000})
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
             */

            const result = await neo.run(
                query, params
            )

            //now we have created the meal plan, we need to create the list
            const listData: {[key: string]: number} = {};
            //total up the final quantities
            for(let i = 0; i < result.records.length; i++){
                const dat = result.records[i];
                const qty = dat.get(1).properties.qty;
                const name = dat.get(2).properties.name;

                if(listData[name])
                    listData[name] += qty
                else
                    listData[name] = qty
            }

            //TODO: look into refactoring with commans i think its more efficient
            const listParams: {[key: string]: unknown} = {plId: ID}
            let listMatchQuery = "MATCH (pl: MealPlan {id: $plId}), "
            let listCreateQuery = "CREATE (l: List), (l)-[:belongsTo]->(pl), ";
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

            throw new GenericError("ree")
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while creating a meal plan.");
        } finally {
            await neo.close()
        }

    }

}