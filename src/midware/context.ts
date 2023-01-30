export interface Context {
    payload: {[key: string]: unknown}|undefined,
    request: {
        req: {
            headers: {
                authorization: string
            }
        }
    }
}

export const createContext = (req: any): Context => {
    return {
        payload: undefined,
        request: req,
    }
}