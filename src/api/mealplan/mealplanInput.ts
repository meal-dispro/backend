// days: 7,
//     meals: ['br','lu','lu','di','sn'],
//     restrictedAlergies: ['celary', 'mustard', 'gluten'],
//     vegan: true,
//     vegetarian: true,
//     minCost: 0,
//     maxCost: 1000,
//     tags: {"im-a-tag": 10, "test2":5, "test3": 2, "boop": 1},//tag:weight
// //metadata - optional, arr.length === days, arr[i].length <= meals.length
// // on monday meal 0 (br) has the constraint of being no more than 10 mins. It doesnt have null padding
// // on tuesday, meal 3 (dinner) must use tags: taco and meal 4 (snack) is ID
// // NOT TO BE IMPLEMENTED: on sunday dinner is a roast. In future, impl ability to select from users favourited recipes
// metadata: [[{"timemax": 10}],[null, null, null, {"tag": "taco"}, {"meal": "0c528a"}],[],[],[],[],[null, null, null, null, {"tag": "roast", fav:true}]],

import {Field, ID, InputType} from "type-graphql";

@InputType()
export class MealplanInput {
    @Field(() => Number)
    days!: number

    @Field(() => [String])
    meals!: [string] //'br', 'lu', 'di', 'sn'

    @Field(() => [String])
    restrictedAlergies!: [string]

    @Field(() => Boolean)
    vegan!: boolean

    @Field(() => Boolean)
    vegetarian!: boolean

    @Field(() => Number)
    minCost!: number

    @Field(() => Number)
    maxCost!: number

    //https://www.apollographql.com/docs/apollo-server/schema/custom-scalars/

    @Field(() => Object)
    tags!: {[key: string]: number}
        //{ "im-a-tag": 10, "test2": 5, "test3": 2, "boop": 1 }

//metadata - optional, arr.length === days, arr[i].length <= meals.length
// on monday meal 0 (br) has the constraint of being no more than 10 mins. It doesnt have null padding
// on tuesday, meal 3 (dinner) must use tags: taco and meal 4 (snack) is ID
// NOT TO BE IMPLEMENTED: on sunday dinner is a roast. In future, impl ability to select from users favourited recipes
//     metadata: [[{ "timemax": 10 }], [null, null, null, { "tag": "taco" }, { "meal": "0c528a" }], [], [], [], [], [null, null, null, null, { "tag": "roast", fav: true }]]
}
