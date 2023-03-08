import {Service} from "typedi";
import {Session} from "neo4j-driver";
import {Recipe} from "./recipe.entity";
import {GenericError} from "../../midware/GenericError";
import {RecipeInput} from "./recipeInput";

const logger = require('pino')()
//https://stackoverflow.com/questions/23281888/how-to-set-the-node-id-other-than-setproperty-in-neo4j
//https://stackoverflow.com/questions/70550455/neo4j-create-relationship-between-nodes-based-on-property


//TODO: create mealplan: https://stackoverflow.com/questions/39327437/cypher-query-to-check-if-list1-contains-any-item-from-list2
// https://stackoverflow.com/questions/75672970/neo4j-count-matches-made-within-list
// MATCH(n) WHERE any(x IN ["high", "im-a-tag", "test2"] WHERE x in n.tags) return n

@Service()
export class RecipeService {
    // constructor(private readonly _: any) {}

    async deleteRecipe(neo: Session, payload: { [p: string]: unknown }, id: string): Promise<boolean> {
        try {
            const result = await neo.run(
                `match (n:Recipe {id: $id}) detach delete n`,
                {id}
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

            const singleRecord = result.records[0]
            const node = singleRecord.get(0).properties;
            node.ingredients = [];

            for (let i = 0; i < result.records.length; i ++) {
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

    async createRecipe(neo: Session, payload: { [p: string]: unknown }, recipeInput: RecipeInput): Promise<Recipe> {
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
                vegan: recipeInput.vegan,
                description: recipeInput.description,
                cooktime: recipeInput.cooktime,
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
                `CREATE (r:Recipe {id: $id, tags: $tags, title: $title, link: $link, description: $description, cooktime: $cooktime, vegan: $vegan, author: $author}) ${mergeIngredients} RETURN r${ins}`,
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