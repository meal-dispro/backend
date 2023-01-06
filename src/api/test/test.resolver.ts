import {
    Resolver,
    Query,
} from 'type-graphql';
import { Test } from './test.entity';
import {Inject, Service} from "typedi";

@Service()
@Resolver((_of) => Test)
export class TestResolver {
    private readonly testService

    constructor(
       private readonly _: any,
    ) {
        this.testService = new (this._.services.find((a: any) => a.id === 'testService').value)(this._);
    }

    @Query(() => String, { nullable: false })
    ping(): string {
        return this.testService.getPong();
    }

}