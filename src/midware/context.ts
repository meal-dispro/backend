import {Driver, Session} from "neo4j-driver";
import {mysqlConnection} from "../dataloader/connectToDatabases";
import {Connection} from "mysql";

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
    myread: Connection|undefined,
    mywrite: Connection|undefined,
    neo: undefined|Session
}

export const createContext = (req: any): Context => {
    return {
        payload: undefined,
        request: req,
        nDrive: undefined,
        myread: undefined,
        mywrite: undefined,
        neo: undefined
    }
}