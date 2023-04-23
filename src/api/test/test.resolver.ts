import {
    Resolver,
    Query,
} from 'type-graphql';
import { Test } from './test.entity';
import {Inject, Service} from "typedi";
import {TestService} from "./test.service";

@Service()
@Resolver((_of) => Test)
export class TestResolver {
    private readonly testService

    constructor(
       private readonly _: any,
    ) {
        this.testService = new TestService(this._);
    }

    @Query(() => String, { nullable: false })
    ping(): string {
        return this.testService.getPong();
    }

}