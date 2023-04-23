import { UserResolver } from './user.resolver'


describe('setup test', ()=> {
    it("to add 'Your user id : ' infront of the payload sub", () => {
        const u = new UserResolver(null);
        const context = {
            payload: {sub: 17},
            request: {req: {headers: {authorization: ''}}},
            neo: undefined,
            nDrive: undefined
        };
        // @ts-ignore
        expect(u.Me(context)).toBe(`Your user id : ${context.payload.sub}`)
    })
})
