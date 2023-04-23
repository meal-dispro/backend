import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import Express from 'express';
import 'reflect-metadata';
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
    const driver: Driver = neo4j.driver("bolt://localhost:7689", neo4j.auth.basic("neo4j", "password"))

    function _createContext (req: any): Context {
        const tmp = createContext(req);
        tmp.nDrive = driver;
        return tmp;
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