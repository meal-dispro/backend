import {Service} from "typedi";

@Service()
export class UserService {
    private readonly db;

    constructor(private readonly _: any) {
        this.db = _.services.find((a: any) => a.id === 'db').value;
    }

    getUser(id: string) {
        // throw new Error("reee")
        return this.db.user.findUnique({
            where: {
                id,
            },
        });
    };
}