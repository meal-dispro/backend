import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import Express from 'express';
//import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import dotenv from 'dotenv';

import { UserResolver } from './api/user/user.resolver';
import {TestResolver} from "./api/test/test.resolver";
import {Container} from "typedi";
import {formatError} from "./midware/GenericError";
import {Context, createContext} from "./midware/context";
import {Driver} from "neo4j-driver";
import {RecipeResolver} from "./api/recipes/recipe.resolver";
import {MealplanResolver} from "./api/mealplan/mealplan.resolver";
import {ListResolver} from "./api/list/list.resolver";
import {mysqlConnection} from "./dataloader/connectToDatabases";
import {Connection} from "mysql";
const neo4j = require('neo4j-driver')

const { db } = require('./prisma/client')
const logger = require('pino')()

const main = async () => {
    dotenv.config();

    //load services
    Container.set({ id: "db", value: db });

    const schema = await buildSchema({
        resolvers: [
            UserResolver,
            RecipeResolver,
            TestResolver,
            MealplanResolver,
            ListResolver,
        ],
        container: Container,
        emitSchemaFile: true,
        validate: false,
    });
    const driver: Driver = neo4j.driver(process.env.BOLT_HOST, neo4j.auth.basic(process.env.NEO_NAME, process.env.NEO_PASS))//, {encrypted:"ENCRYPTION_OFF",})
    const mysql = {myread:undefined, mywrite: undefined};
    mysqlConnection(mysql, "read");
    mysqlConnection(mysql, "write");

    function _createContext (req: any): Context {
        const ctx = createContext(req);
        ctx.nDrive = driver;
        ctx.myread = mysql.myread;
        ctx.mywrite = mysql.mywrite;
        return ctx;
    }

    const server = new ApolloServer({
        schema,
        plugins: [ ApolloServerPluginLandingPageGraphQLPlayground ],
        formatError: formatError,
        context: _createContext,
    });
    // resolvers: await loadFiles('src/api/**/*.graphql'),

    const app = Express();
    const PORT = Number(process.env.PORT);

    await server.start();

    // @ts-ignore
    server.applyMiddleware({ app });

    //cleanup
    process.on('SIGTERM', async () => {
        console.info('SIGTERM signal received (kill).');
        await driver.close()
    });
    process.on('SIGINT', async () => {
        console.info('SIGINT signal received (terminal).');
        await driver.close()
    });

    app.listen({ port: PORT }, () =>
        logger.info(
            `Server ready and listening at http://localhost:${PORT}${server.graphqlPath}`
        )
    );
};

main().catch((error) => {
    logger.error(error, 'error');
});