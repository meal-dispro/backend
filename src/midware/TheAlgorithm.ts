import {MealplanInput} from "../api/mealplan/mealplanInput";
import {GenericError} from "./GenericError";
import {Session} from "neo4j-driver";

export class TheAlgorithm {
    tags: string[];
    data: MealplanInput;
    neo: Session;

    constructor(neo: Session, data: MealplanInput) {
        //validations
        if(data.cost.length > 3) throw new GenericError("Max cost: £££");

        this.neo = neo;
        this.data = data;
        this.tags = Object.keys(data.tags);
    }

    getPlan = async ()=>{
        const data = await this._filterModule();

        const output = this._decisionModule(data);

    }

    _buildQuery = ()=>{
        //TODO: change limit based on factors
        //init vars
        let queryString = `MATCH (n: Recipe {type: $type`;
        const queryData:
            {type:string,
                vegan?:boolean,
                vegetarian?: boolean,
                cost: number,
                // limit: number,
                tags: string[],
                [key:string]: unknown
            } = {
            type: "lunch",
            cost: this.data.cost.length,
            tags: this.tags,
            // limit: 35
        }

        //TODO: remove
        queryData.cost = 9000

        //add static match options
        if(this.data.vegan) {//if vegan, else do nothing because (not vegan == vegan || not vegan)
            queryString += ', vegan: $vegan'
            queryData['vegan'] = true;
        }
        if(this.data.vegetarian) { //if vegetarian
            queryString += ', vegetarian: $vegetarian'
            queryData['vegetarian'] = true;
        }
        queryString += '}) ';

        //max cost
        queryString += `WHERE n.cost <= $cost `;

        //alergies
        for(let i = 0; i < this.data.restrictedAlergies.length; i++){
            //`AND NOT ((n)-[:uses]->(:Ingredient {name: "stock"})) `
            queryData[`in${i}`] = this.data.restrictedAlergies[i];
            queryString += `AND NOT ((n)-[:uses]->(:Ingredient {name: $in${i}})) `
        }

        //calculate weights and order
        queryString += `WITH size(apoc.coll.intersection(n.tags, $tags)) as weight, n ORDER BY weight DESC `

        //limit order and return TODO: change limit
        queryString += `LIMIT 35 RETURN { properties: properties(n), weight: weight }`
        // ???         //         WHERE weight > 0
        return {queryString, queryData};
    }

    _filterModule = async ()=>{
        const qDat = this._buildQuery();

        //get the data
        const result = await this.neo.run(
            qDat.queryString,
            qDat.queryData
        )

        if(result.records.length === 0)
            throw new GenericError('no matches');

        //message reporting
        let zeroWeightFlag = false;

        const matrix: number[][] = [];
        const index: string[] = [];

        //for each record, create a data matrix and id lookup table.
        for(let i = 0; i < result.records.length; i++) {
            const singleRecord = result.records[i]
            let weight = Number(singleRecord.get(0).weight);
            const node = singleRecord.get(0).properties;

            //if meal matches tags, multiply by tag weights to get final weight
            if(weight > 0) {
                for(let i = 0; i < node.tags.length; i++)
                    if(this.tags.includes(node.tags[i]))
                        weight *= this.data.tags[node.tags[i]]
            }else zeroWeightFlag = true;

            //create matrix with data entries for TOPSIS.
            matrix.push([weight, node.cost, node.cooktime])
            //create lookup table for resolving
            index.push(node.id);
        }

        return {index, matrix, zeroWeightFlag};
    }

    _decisionModule = (filteredData: {index: string[], zeroWeightFlag: boolean, matrix: number[][]})=>{

    }

    _write = async () => {}
}