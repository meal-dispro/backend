import {Service} from "typedi";
import {Session} from "neo4j-driver";
import {Recipe} from "./recipe.entity";
import {GenericError} from "../../midware/GenericError";
import {RecipeInput} from "./recipeInput";

const logger = require('pino')()


@Service()
export class RecipeService {
    // constructor(private readonly _: any) {}

    async randomRecipe(neo: Session, lim: number): Promise<Recipe[]> {
        // await this.bulkCreateRecipe(neo);
        if (!Number(lim)) throw new GenericError("Limit must be a number");
        if (lim < 0) lim = 1;
        if (lim > 20) lim = 20;
        const q = `MATCH (r:Recipe) WITH r, rand() AS number ORDER BY number LIMIT ${lim} RETURN r`;
        try {
            const result = await neo.run(q)

            if (result.records.length === 0)
                throw new GenericError('Could not find any recipes.');

            const nodes: Recipe[] = [];

            for (let i = 0; i < result.records.length; i++) {
                const singleRecord = result.records[i]
                const node = singleRecord.get(0).properties;
                node.ingredients = []; //attribute required but not provided.
                nodes.push(node);
            }
            return nodes;
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while deleting recipe.");
        } finally {
            await neo.close()
        }
    }

    async deleteRecipe(neo: Session, payload: { [p: string]: unknown }, id: string): Promise<boolean> {
        try {
            const result = await neo.run(
                `match (n:Recipe {id: $id, author: $auth}) detach delete n`,
                {id, auth: payload.sub}
            )
            return true;
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while deleting recipe.");
        } finally {
            await neo.close()
        }

    }

    async getRecipe(neo: Session, payload: { [p: string]: unknown }, id: string): Promise<Recipe> {
        try {
            const result = await neo.run(
                `MATCH(r:Recipe {id:$id})-[u:uses]-(i:Ingredient) return r,i,u`,
                {id}
            )

            if (result.records.length === 0)
                throw new GenericError('Recipe does not exist');

            const singleRecord = result.records[0]
            const node = singleRecord.get(0).properties;
            node.ingredients = [];

            for (let i = 0; i < result.records.length; i++) {
                node.ingredients.push({
                    name: result.records[i].get(1).properties.name,
                    qty: result.records[i].get(2).properties.qty
                });
            }

            return node;
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while getting recipe.");
        } finally {
            await neo.close()
        }
    }

    async bulkCreateRecipe(neo: Session) {
        const s = "bulkinsertstresstest";
        const total = 100000;
        for(let i = 0; i < total; i++) {
            if(i % (total/10) === 0) console.log(`${i/total*100}%`)

            const ID = (() => {
                let n = (Math.random() * 0xfffff * 1000000).toString(16);
                return n.slice(0, 9);
            })();

            const c = {
                id: ID,
                tags: [s],
                title: s+i,
                link: s,
                icon: s,
                type: 'lunch',
                vegan: true,
                vegetarian: true,
                description: s,
                cooktime: 1,
                cost: 1,
                serves: i, //TO DELETE IN SECTIONS
                author: 19,
                ingName: s,
                qty: 1,
            }

            const result = await neo.run(
                `CREATE (r:Recipe {id: $id, tags: $tags, title: $title, type: $type, link: $link, description: $description, cooktime: $cooktime, serves: $serves, cost: $cost, vegan: $vegan, vegetarian: $vegetarian, author: $author}) MERGE (in:Ingredient {name: $ingName}) MERGE (r)-[ri:uses {qty: $qty}]->(in) RETURN r`,
                c
            )
        }
        console.log("done");
    }


    async createRecipe(neo: Session, payload: { [p: string]: unknown }, recipeInput: RecipeInput): Promise<Recipe> {
        if (!["breakfast", "lunch", "dinner", "snack"].includes(recipeInput.type))
            throw new GenericError("Meal type must be one of [\"breakfast\", \"lunch\", \"dinner\", \"snack\"]")
        if (recipeInput.vegan)
            recipeInput.vegetarian = true;
        // @ts-ignore
        if (recipeInput.ingredients.length === 0)
            throw new GenericError("Meal must contain ingredients")


        /**
         CREATE (r:Recipe {title:'new2'})
         MERGE (i:Ingredient {name: 'passata'})
         MERGE (r)-[:uses {qty: 5}]->(i)
         MERGE (i2:Ingredient {name: 'passata2.0'})
         MERGE (r)-[:uses {qty: 50}]->(i2)
         RETURN r,i,i2
         */
        try {
            const ID = (() => {
                let n = (Math.random() * 0xfffff * 1000000).toString(16);
                return n.slice(0, 9);
            })();

            let mergeIngredients = '';
            const params: { [key: string]: unknown } = {
                id: ID,
                tags: recipeInput.tags,
                title: recipeInput.title,
                link: recipeInput.link,
                icon: recipeInput.icon,
                type: recipeInput.type,
                vegan: recipeInput.vegan,
                vegetarian: recipeInput.vegetarian,
                description: recipeInput.description,
                cooktime: recipeInput.cooktime,
                cost: recipeInput.cost,
                serves: recipeInput.serves,
                author: payload.sub
            };
            let ins = '';

            for (let i = 0; i < recipeInput.ingredients.length; i++) {
                ins += `,i${i},ri${i}`
                mergeIngredients += `MERGE (i${i}:Ingredient {name: $ingName${i}}) MERGE (r)-[ri${i}:uses {qty: $qty${i}}]->(i${i})`
                params['ingName' + i] = recipeInput.ingredients[i].name;
                params['qty' + i] = recipeInput.ingredients[i].qty;
            }

            const result = await neo.run(
                `CREATE (r:Recipe {id: $id, tags: $tags, title: $title, type: $type, link: $link, description: $description, cooktime: $cooktime, serves: $serves, cost: $cost, vegan: $vegan, vegetarian: $vegetarian, author: $author}) ${mergeIngredients} RETURN r${ins}`,
                params
            )

            const singleRecord = result.records[0]
            const node = singleRecord.get(0).properties;
            node.ingredients = [];

            for (let i = 1; i <= recipeInput.ingredients.length * 2; i += 2) {
                node.ingredients.push({
                    name: singleRecord.get(i).properties.name,
                    qty: singleRecord.get(i + 1).properties.qty
                });
            }

            return node;
        } catch (e) {
            logger.error(e);
            throw new GenericError("An error occurred while creating a new recipe.");
        } finally {
            await neo.close()
        }

    }

}