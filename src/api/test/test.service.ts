import {Service} from "typedi";

@Service()
export class TestService {
    constructor(private readonly _: any) {}

    getPong() {
        return "Pong! Hello World!! ree"
    };
}