import neo4j, {Driver} from "neo4j-driver";
import {RecipeResolver} from "./recipe.resolver";

const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
const Session = driver.session();

describe('setup test', ()=> {
    it("to add 'Your user id : ' infront of the payload sub", () => {
        const u = new RecipeResolver(null);
        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };
        // @ts-ignore
        expect(u.Me(context)).toBe(`Your user id : ${context.payload.sub}`)
    })
})
