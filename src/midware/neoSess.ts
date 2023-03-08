/*References
 https://codevoweb.com/typegraphql-mongodb-graphql-api-jwt-authentication/
 https://www.mitrais.com/news-updates/graphql-server-authorization-with-jwt/
 https://stackoverflow.com/questions/68056705/passing-request-into-apollo-server-context-generated-in-function

 */

import {MiddlewareFn} from "type-graphql";
import {Context} from "./context";

export const neoSess: MiddlewareFn<Context> = ({ context }, next) => {
    context.neo = context.nDrive?.session();
    return next();
};