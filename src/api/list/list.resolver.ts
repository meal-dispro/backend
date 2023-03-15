import {
    Resolver,
    Mutation,
    Arg,
    UseMiddleware, Ctx, Query,
} from 'type-graphql';
import {Service} from "typedi";
import {ListService} from "./list.service";
import {isAuth} from "../../midware/auth";
import {Context} from "../../midware/context";
import {neoSess} from "../../midware/neoSess";
import {List} from "./list.entity";
import {GenericError} from "../../midware/GenericError";
import {AddItem, CheckItem, GetList, RemoveItem} from "./listInput";

@Service()
@Resolver((_of) => List)
export class ListResolver {
    private readonly listService: ListService

    constructor(
        private readonly _: any,
    ) {
        this.listService = new (this._.services.find((a: any) => a.id === 'listService').value)(this._);
    }

    @Query(() => List)
    @UseMiddleware(isAuth, neoSess)
    async getList(@Ctx() { payload, neo }: Context, @Arg('data', ()=>GetList) data: GetList): Promise<List>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.listService.getList(neo, payload, data.id);
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth, neoSess)
    async checkListItem(@Ctx() { payload, neo }: Context, @Arg('data', ()=>CheckItem) data: CheckItem): Promise<boolean>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.listService.checkItem(neo, payload, data.id, data.name, data.checked);
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth, neoSess)
    async setListItemQty(@Ctx() { payload, neo }: Context, @Arg('data', ()=>AddItem) data: AddItem): Promise<boolean>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.listService.addItem(neo, payload, data.id, data.name, data.qty);
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth, neoSess)
    async removeListItem(@Ctx() { payload, neo }: Context, @Arg('data', ()=>RemoveItem) data: RemoveItem): Promise<boolean>{
        if(!neo || !payload) throw new GenericError("An internal error occurred 0x3c3b")
        return await this.listService.removeItem(neo, payload, data.id, data.name);
    }
}