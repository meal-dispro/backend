import {Driver, Session} from "neo4j-driver";

export interface Context {
    payload: {[key: string]: unknown}|undefined,
    request: {
        req: {
            headers: {
                authorization: string
            }
        }
    }
    nDrive: Driver|undefined
    neo: undefined|Session
}

export const createContext = (req: any): Context => {
    return {
        payload: undefined,
        request: req,
        nDrive: undefined,
        neo: undefined
    }
}