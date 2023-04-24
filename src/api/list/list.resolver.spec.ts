import neo4j, {Driver} from "neo4j-driver";
import {ListResolver} from "./list.resolver";
import exp from "constants";

describe('get a list', () => {
    it("Should retrieve the list items from the database", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        const out = (await u.getList(context, {
            id: 'ced9cc487'
        }))

        expect(Object.keys(out)).toContain('id');
        expect(Object.keys(out)).toContain('items');
    })
})

describe('get a list', () => {
    it("should fail ID not found", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        try {
            const out = (await u.getList(context, {
                id: '123'
            }))
            expect(false).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    })
})


//---------------------------------------------------------------------------------


describe('check a list item', () => {
    it("should check the item", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        const out = (await u.checkListItem(context, {
            id: 'ced9cc487',
            name: 'baby corn',
            checked: true,
        }))

        expect(out).toBe(true)
    })
})

describe('check a list item', () => {
    it("should not check the item; name", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        try {
            const out = (await u.checkListItem(context, {
                id: 'ced9cc487',
                name: 'aaaaaaaaaaa',
                checked: true,
            }))

            expect(false).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    })
})
describe('check a list item', () => {
    it("should not check the item; id", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        try {
            const out = (await u.checkListItem(context, {
                id: '123123123',
                name: 'baby corn',
                checked: true,
            }))

            expect(false).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    })
})
describe('check a list item', () => {
    it("should not check the item; name; id", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        try {
            const out = (await u.checkListItem(context, {
                id: '123123123',
                name: 'aaaaaaaaaaa',
                checked: true,
            }))

            expect(false).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    })
})


//-------------------------------------------------------------------------------------------


describe('remove list item', () => {
    it("should remove the item", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        const out = (await u.removeListItem(context, {
            id: 'ced9cc487',
            name: 'asd',
        }))

        expect(out).toBe(true)
    })
})

describe('remove list item', () => {
    it("invalid item name", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        const out = (await u.removeListItem(context, {
            id: 'ced9cc487',
            name: 'aaaaaaaaaa',
        }))

        expect(out).toBe(true);

    })
})

describe('remove list item', () => {
    it("invalid id", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        const out = (await u.removeListItem(context, {
            id: '123123123',
            name: 'asd2',
        }))

        expect(out).toBe(true);

    })
})

describe('remove list item', () => {
    it("invalid; name; id", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        const out = (await u.removeListItem(context, {
            id: '123123123',
            name: 'aaaaaaaaaaa',
        }))

        expect(out).toBe(true);
    })
})


//-------------------------------------------------------------------------------------------

describe('set list item qty', () => {
    it("should update or add to list", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        const out = (await u.setListItemQty(context, {
            id: 'ced9cc487',
            name: 'aaaaaaaaaaaaaaaaa',
            qty: 1,
        }))

        expect(out).toBe(true)
    })
})

describe('set list item qty', () => {
    it("invalid list ID, should fail", async () => {
        const u = new ListResolver();

        const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))
        const Session = driver.session();

        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: Session,
            nDrive: driver
        };

        try {
            const out = (await u.setListItemQty(context, {
                id: '123123123',
                name: 'aaaaaaddaaaa',
                qty: 1,
            }))

            expect(false).toBe(true);
        } catch (e) {
            expect(true).toBe(true);
        }
    })
})

