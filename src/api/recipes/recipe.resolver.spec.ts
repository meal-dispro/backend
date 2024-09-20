import neo4j, {Driver} from "neo4j-driver";
import {RecipeResolver} from "./recipe.resolver";
import {ListResolver} from "../list/list.resolver";

let id = "";

describe('create a recipe', () => {
    it("to create a recipe with the specified values, adding 'vegetarian' and 'vegan' as false since neither are set", async () => {
        const u = new RecipeResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver,
            myread: undefined,
            mywrite: undefined,
        };

        const noVegan = await u.createRecipe(context, {
            serves: 5,
            title: "testing",
            tags: ["curry"],
            link: "https://localhost.com",
            icon: "https://localhost.com",
            description: "yay",
            cooktime: 45,
            cost: 1,
            type: "dinner",
            ingredients: [
                {name: "cauliflour", qty_typ: "gram", qty: 1}, {
                    name: "curry paste",
                    qty_typ: "gram",
                    qty: 2
                }, {name: "naan bread", qty_typ: "gram", qty: 3},
            ]
        });

        id = noVegan.id

        expect(noVegan).toEqual({
            id,
            title: 'testing',
            cost: 1,
            type: 'dinner',
            cooktime: 45,
            icon: 'https://localhost.com',
            link: 'https://localhost.com',
            tags: ["curry"],
            description: 'yay',
            vegan: false,
            vegetarian: false,
            author: context.payload.sub,
            serves: 5,
            ingredients: [{name: "cauliflour", qty_typ: "gram", qty: 1}, {
                name: "curry paste",
                qty_typ: "gram",
                qty: 2
            }, {name: "naan bread", qty_typ: "gram", qty: 3},]
        })
    })
})

it("to create a recipe with all the specified values", async () => {
    const u = new RecipeResolver();

    const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
    const Session = driver.session();

    const context = {
        payload: {sub: 17},
        request: {req: {headers: {authorization: ''}}},
        neo: Session,
        nDrive: driver,
        myread: undefined,
        mywrite: undefined,
    };

    const allprops = await u.createRecipe(context, {
        serves: 5,
        title: "testing",
        tags: ["curry"],
        link: "https://localhost.com",
        icon: "https://localhost.com",
        description: "yay",
        cooktime: 45,
        vegan: false,
        vegetarian: false,
        cost: 1,
        type: "dinner",
        ingredients: [
            {name: "cauliflour", qty_typ: "gram", qty: 1}, {
                name: "curry paste",
                qty_typ: "gram",
                qty: 2
            }, {name: "naan bread", qty_typ: "gram", qty: 3},
        ]
    });
    expect(allprops).toEqual({
        id: allprops.id,
        title: 'testing',
        cost: 1,
        type: 'dinner',
        cooktime: 45,
        icon: 'https://localhost.com',
        link: 'https://localhost.com',
        tags: ["curry"],
        description: 'yay',
        vegan: false,
        vegetarian: false,
        author: context.payload.sub,
        serves: 5,
        ingredients: [{name: "cauliflour", qty_typ: "gram", qty: 1}, {
            name: "curry paste",
            qty_typ: "gram",
            qty: 2
        }, {name: "naan bread", qty_typ: "gram", qty: 3},]
    })
})

describe('create a recipe', () => {
    it("to create a recipe with the specified values, adding 'vegetarian' as true as vegan is true", async () => {
        const u = new RecipeResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver,
            myread: undefined,
            mywrite: undefined,
        };

        const noVegetarian = await u.createRecipe(context, {
            serves: 5,
            title: "testing",
            tags: ["curry"],
            link: "https://localhost.com",
            icon: "https://localhost.com",
            description: "yay",
            vegan: true,
            cooktime: 45,
            cost: 1,
            type: "dinner",
            ingredients: [
                {name: "cauliflour", qty_typ: "gram", qty: 1}, {
                    name: "curry paste",
                    qty_typ: "gram",
                    qty: 2
                }, {name: "naan bread", qty_typ: "gram", qty: 3},
            ]
        });

        expect(noVegetarian).toEqual({
            id: noVegetarian.id,
            title: 'testing',
            cost: 1,
            type: 'dinner',
            cooktime: 45,
            icon: 'https://localhost.com',
            link: 'https://localhost.com',
            tags: ["curry"],
            description: 'yay',
            vegan: true,
            vegetarian: true,
            author: context.payload.sub,
            serves: 5,
            ingredients: [{name: "cauliflour", qty_typ: "gram", qty: 1}, {
                name: "curry paste",
                qty_typ: "gram",
                qty: 2
            }, {name: "naan bread", qty_typ: "gram", qty: 3},]
        })
    })
})

describe('create a recipe', () => {
    it("to throw an error as no ingredients are provided", async () => {
        const u = new RecipeResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver,
            myread: undefined,
            mywrite: undefined,
        };

        try {
            await u.createRecipe(context, {
                serves: 5,
                title: "testing",
                tags: ["curry"],
                link: "https://localhost.com",
                icon: "https://localhost.com",
                description: "yay",
                vegan: true,
                cooktime: 45,
                cost: 1,
                type: "dinner",
                ingredients: []
            })
            expect(false).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    })
})

//-------------------------------------------------------------------------------------------

describe('get a recipe', () => {
    it("should get a recipe object", async () => {
        const u = new RecipeResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver,
            myread: undefined,
            mywrite: undefined,
        };

        const out = (await u.getRecipe(context, {
            id,
        }))

        expect(out.id).toBe(id)
    })
})

describe('get a recipe', () => {
    it("invalid  ID, should fail", async () => {
        const u = new RecipeResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver,
            myread: undefined,
            mywrite: undefined,
        };

        try {
            const out = (await u.getRecipe(context, {
                id: '123123123',
            }))

            expect(false).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    })
})


//-------------------------------------------------------------------------------------------


describe('remove recipe', () => {
    it("valid id", async () => {
        const u = new RecipeResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver,
            myread: undefined,
            mywrite: undefined,
        };

        const out = (await u.deleteRecipe(context, {
            id,
        }))

        expect(out).toBe(true);

    })
})

describe('remove recipe', () => {
    it("invalid; recipe id", async () => {
        const u = new RecipeResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver,
            myread: undefined,
            mywrite: undefined,
        };

        const out = (await u.deleteRecipe(context, {
            id: '123123123',
        }))

        expect(out).toBe(true);
    })
})
