export class GenericError extends Error {
    constructor(message: string) {
        super('[20]' + message);
    }
}