/*References
 https://codevoweb.com/typegraphql-mongodb-graphql-api-jwt-authentication/
 https://www.mitrais.com/news-updates/graphql-server-authorization-with-jwt/
 https://stackoverflow.com/questions/68056705/passing-request-into-apollo-server-context-generated-in-function

 */

import {MiddlewareFn} from "type-graphql";
import jwt from "jwt-simple";
import {GenericError} from "./GenericError";
import {Context} from "./context";
const logger = require('pino')()

// const { ApolloServer, gql, AuthenticationError } = require('apollo-server');

export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
    context.payload = {sub: "5E389C6A"};
    return next();

    //TODO: this

    const secret = "12345";//TODO not hardcode
    const authorization = context.request.req.headers["authorization"];

    if (!authorization) {
        throw new GenericError("Not authenticated, please log in");
    }

    try {
        const token = authorization.split(" ")[1];
        const payload = jwt.decode(token, secret);
        context.payload = payload as any;
    } catch (err) {
        logger.error(err);
        throw new GenericError("Invalid authentication token: TODO attempt to refresh");
        //https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
    }
    return next();
};