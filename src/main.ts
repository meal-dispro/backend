import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import Express from 'express';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import dotenv from 'dotenv';

import { UserResolver } from './api/user/user.resolver';
import {TestResolver} from "./api/test/test.resolver";
import {Container} from "typedi";
import {TestService} from "./api/test/test.service";
import {UserService} from "./api/user/user.service";
import {formatError} from "./midware/GenericError";
import {Context, createContext} from "./midware/context";
import {Driver} from "neo4j-driver";
import {RecipeService} from "./api/recipes/recipe.service";
import {RecipeResolver} from "./api/recipes/recipe.resolver";

const neo4j = require('neo4j-driver')

const { db } = require('./prisma/client')
const logger = require('pino')()

const main = async () => {
    dotenv.config();

    //load services
    Container.set({ id: "_", value: "ree" });
    Container.set({ id: "db", value: db });
    Container.set({ id: "testService", value: TestService });
    Container.set({ id: "userService", value: UserService });
    Container.set({ id: "recipeService", value: RecipeService });

    const schema = await buildSchema({
        resolvers: [
            UserResolver,
            RecipeResolver,
            TestResolver,
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

    const app = Express();
    const PORT = Number(process.env.PORT);

    await server.start();

    // @ts-ignore
    server.applyMiddleware({ app });

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