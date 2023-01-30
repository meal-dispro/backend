import {GraphQLError} from "graphql";
const logger = require('pino')()

export class GenericError extends Error {
    constructor(message: string) {
        super('[20]' + message);
    }
}

export function formatError(err: GraphQLError){
    const flag20 = err.message.startsWith('[20]');
    let code = '';

    if(!flag20){
        code = (() => {
            let n = (Math.random() * 0xfffff * 1000000).toString(16);
            return '0x' + n.slice(0, 8);
        })();

        logger.error({...err, _CODE: code});
    }

    if(process.env.ENV !== 'PROD')
        return err;

    if(flag20)
        return {
            message: err.message.replace('[20]', ''),
        }

    return { message: `internal error (${code})`}
}