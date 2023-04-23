import {GraphQLScalarType, Kind} from "graphql";
import {GenericError} from "../../midware/GenericError";
export const
    Tags=new GraphQLScalarType({
        name: "Tags",
        description: "testing",
        serialize: (value) => {
            if (value === 'object' || value.length) {
                return value
            } else {
                try {
                    return JSON.parse(value)
                } catch (e) {
                    throw new GenericError(e+'' ?? 'oops');//TODO change err logs
                    return null
                }
            }
        },
        parseLiteral: (ast) => {
            switch (ast.kind) {
                case Kind.STRING:
                    return JSON.parse(ast.value)
                case Kind.OBJECT:
                    throw new GenericError(`failed to parse arbitrary object for ObjectScalarType`)
                default:
                    return null
            }
        }
    })

