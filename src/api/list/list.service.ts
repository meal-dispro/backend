import {Service} from "typedi";
import {Session} from "neo4j-driver";
import {GenericError} from "../../midware/GenericError";
import {List} from "./list.entity";

const logger = require('pino')()

@Service()
export class ListService {

    async getList(neo: Session, payload: { [p: string]: unknown }, id:string): Promise<List>{
        try {
            let query = "MATCH (l:List)-[c:contains]->(i:Ingredient) WHERE l.id = $id return l,c,i";
            const params: {[key: string]: unknown} = {id}
            const result = await neo.run(
                query, params
            )

            const data = result.records;

            if(data.length === 0)
                throw new GenericError("List not found");

            // @ts-ignore -- initialise items with loop
            const out: List = {id: data[0].get(0).properties.id, items: []};

            for(let i = 0; i < data.length; i++){
                const rel = data[i].get(1).properties;
                const itm = data[i].get(2).properties;
                out.items.push({item: {qty: rel.qty, name: itm.name}, checked: rel.checked});
            }
            return out;
        } catch (e) {
            if(e instanceof GenericError)
                throw e;

            logger.error(e);
            throw new GenericError("An error occurred while getting a list.");
        } finally {
            await neo.close()
        }
    }

    async checkItem(neo: Session, payload: { [p: string]: unknown }, id:string, name: string, state: boolean): Promise<boolean>{
        try {
            let query = "MATCH (l:List)-[c:contains]->(i:Ingredient) WHERE l.id = $id AND i.name=$name SET c.checked=$state return l,c,i";
            const params: {[key: string]: unknown} = {id, name, state}
            const result = await neo.run(
                query, params
            )

            if(result.records.length === 0)
                throw new GenericError('Item does not exist in list');

            return state;
        } catch (e) {
            if(e instanceof GenericError)
                throw e;

            logger.error(e);
            throw new GenericError("An error occurred while updating a list item.");
        } finally {
            await neo.close()
        }
    }

    //link or create new item
    //overrides qty val if exists
    async addItem(neo: Session, payload: { [p: string]: unknown }, id:string, name: string, qty: number): Promise<boolean>{
        try {
            let query = "MATCH(l:List) WHERE l.id = $id CREATE (l)-[c:contains {checked:false, qty:$qty}]->(i:Ingredient {name: $name}) return l,c,i";
            const params: {[key: string]: unknown} = {id, name, qty}
            const result = await neo.run(
                query, params
            )

            if(result.records.length === 0)
                throw new GenericError('List does not exist');

            return true;
        } catch (e) {
            if(e instanceof GenericError)
                throw e;

            logger.error(e);
            throw new GenericError("An error occurred while updating a list item.");
        } finally {
            await neo.close()
        }
    }

    async removeItem(neo: Session, payload: { [p: string]: unknown }, id:string, name: string): Promise<boolean>{
        try {
            let query = "MATCH (l:List)-[c:contains]->(i:Ingredient) WHERE l.id = $id AND i.name = $name delete c";
            const params: {[key: string]: unknown} = {id, name}
            const result = await neo.run(
                query, params
            )

            return true;
        } catch (e) {
            if(e instanceof GenericError)
                throw e;

            logger.error(e);
            throw new GenericError("An error occurred while updating a list item.");
        } finally {
            await neo.close()
        }
    }

}