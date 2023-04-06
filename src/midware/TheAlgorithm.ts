import {MealplanInput} from "../api/mealplan/mealplanInput";
import {GenericError} from "./GenericError";
import {Session} from "neo4j-driver";

export class TheAlgorithm {
    tags: string[];
    data: MealplanInput;
    neo: Session;

    constructor(neo: Session, data: MealplanInput) {
        //validations
        if (data.cost.length > 3) throw new GenericError("Max cost: £££");

        this.neo = neo;
        this.data = data;
        this.tags = Object.keys(data.tags);
    }

    //parses the data to a matrix plan
    getPlan = async (): Promise<{ mealplan: string[][], zeroWeightFlag: boolean }> => {
        //lookup func
        const f = (s: "br" | "lu" | "di" | "sn"): "breakfast" | "lunch" | "dinner" | "snack" => {
            const lookup = {"br": 'breakfast', "lu": 'lunch', "di": 'dinner', "sn": 'snack'}
            // @ts-ignore
            return lookup[s];
        }

        //count meal types
        const count = {
            "breakfast": 0,
            "lunch": 0,
            "dinner": 0,
            "snack": 0,
        }
        for (let i = 0; i < this.data.meals.length; i++) {
            count[f(this.data.meals[i])] += this.data.days;
        }

        //init output matrix
        const mealplan: string[][] = [];
        for (let i = 0; i < this.data.days; i++) mealplan.push([]);

        //filters data from the database then selects "cnt" recipes for plan
        const genList = async (type: "breakfast" | "lunch" | "dinner" | "snack"): Promise<string[]> => {
            if (count[type] > 0) {
                const cnt = count[type];
                const lim = (cnt * 2) > 35 ? 35 : cnt * 2;//add a buffer to allow for variety

                const dat = await this._filterModule(type, lim);
                if (!dat) return []
                return this._decisionModule(cnt, dat);
            }
            return [];
        }

        //breakfast
        const brPlan = await genList("breakfast");
        //lunch
        const luPlan = await genList("lunch");
        //dinner
        const diPlan = await genList("dinner");
        //snack
        const snPlan = await genList("snack");


        //add a meal to each day of the plan
        const addMeal = (plan: string[], m: number) => {
            for (let d = 0; d < this.data.days; d++){
                const val = plan.shift() ?? "error";
                plan.push(val);//cycle meals to provide meals if low results
                mealplan[d][m] = val;
            }
        }

        //max 35 iterations, add each meal to plan
        for (let m = 0; m < this.data.meals.length; m++) {
            if (this.data.meals[m] === "br" && brPlan)
                addMeal(brPlan, m);

            if (this.data.meals[m] === "lu" && luPlan)
                addMeal(luPlan, m);

            if (this.data.meals[m] === "di" && diPlan)
                addMeal(diPlan, m);

            if (this.data.meals[m] === "sn" && snPlan)
                addMeal(snPlan, m);
        }


        return {mealplan, zeroWeightFlag: false};
    }

    _buildQuery = (type: "breakfast" | "lunch" | "dinner" | "snack", limit: number) => {
        //init vars
        let queryString = `MATCH (n: Recipe {type: $type`;
        const queryData:
            {
                type: string,
                vegan?: boolean,
                vegetarian?: boolean,
                cost: number,
                // limit: Integer,
                tags: string[],
                [key: string]: unknown
            } = {
            type,
            cost: this.data.cost.length,
            tags: this.tags,
            // limit: 35
        }

        //add static match options
        if (this.data.vegan) {//if vegan, else do nothing because (not vegan == vegan || not vegan)
            queryString += ', vegan: $vegan'
            queryData['vegan'] = true;
        }
        if (this.data.vegetarian) { //if vegetarian
            queryString += ', vegetarian: $vegetarian'
            queryData['vegetarian'] = true;
        }
        queryString += '}) ';

        //max cost
        queryString += `WHERE n.cost <= $cost `;

        //alergies
        for (let i = 0; i < this.data.restrictedAlergies.length; i++) {
            //`AND NOT ((n)-[:uses]->(:Ingredient {name: "stock"})) `
            queryData[`in${i}`] = this.data.restrictedAlergies[i];
            queryString += `AND NOT ((n)-[:uses]->(:Ingredient {name: $in${i}})) `
        }

        //calculate weights and order
        queryString += `WITH size(apoc.coll.intersection(n.tags, $tags)) as weight, n ORDER BY weight DESC `

        //limit order and return
        queryString += `LIMIT ${limit} RETURN { properties: properties(n), weight: weight }`
        // ???         //         WHERE weight > 0

        return {queryString, queryData};
    }

    _filterModule = async (type: "breakfast" | "lunch" | "dinner" | "snack", limit: number) => {
        const qDat = this._buildQuery(type, limit);

        //get the data
        const result = await this.neo.run(
            qDat.queryString,
            qDat.queryData
        )

        if (result.records.length === 0)
            return null;

        //message reporting
        let zeroWeightFlag = false;

        const matrix: number[][] = [];
        const index: string[] = [];

        //for each record, create a data matrix and id lookup table.
        for (let i = 0; i < result.records.length; i++) {
            const singleRecord = result.records[i]
            let weight = Number(singleRecord.get(0).weight);
            const node = singleRecord.get(0).properties;

            //if meal matches tags, multiply by tag weights to get final weight
            if (weight > 0) {
                for (let i = 0; i < node.tags.length; i++)
                    if (this.tags.includes(node.tags[i]))
                        weight *= this.data.tags[node.tags[i]]
            } else zeroWeightFlag = true;

            //create matrix with data entries for TOPSIS.
            //Note: must specify min/max in algo
            matrix.push([weight, node.cost, node.cooktime])
            //create lookup table for resolving
            index.push(node.id);
        }

        return {index, matrix, zeroWeightFlag};
    }

    _decisionModule = (qty: number, filteredData: { index: string[], zeroWeightFlag: boolean, matrix: number[][] }): string[] => {
        //https://www.youtube.com/watch?v=Br1NQK0Iumg

        //matrix[i][j]
        //i = recipe
        //j = attr

        const normalized = filteredData.matrix;

        //normalize: sum over each attribute
        // X[i][j] / sqrt( sum( X[ii][j] ^ 2 ) )
        for (let j = 0; j < normalized[0].length; j++) {
            let div = 0;
            for (let ii = 0; ii < normalized.length; ii++)
                div += Math.pow(normalized[ii][j], 2);
            div = Math.sqrt(div);

            for (let i = 0; i < normalized.length; i++)
                normalized[i][j] /= div;
        }

        // console.log(normalized);

        //calculate weight: no

        //calculate best/worst (min/max) over each attribute
        const best = [];
        const worst = [];
        for (let j = 0; j < normalized[0].length; j++) {
            let be = normalized[0][j];
            let wo = normalized[0][j];
            for (let ii = 1; ii < normalized.length; ii++) {
                if (j === 0) {
                    //j=0 weight - max = best
                    const weight = normalized[ii][j];
                    if (be < weight) be = weight;
                    if (wo > weight) wo = weight;
                } else if (j === 1) {
                    //j=1 cost - TODO look at metadata
                    const cost = normalized[ii][j];
                    if (be > cost) be = cost;
                    if (wo < cost) wo = cost;
                } else if (j === 2) {
                    //j=2 cooktime - TODO look at metadata
                    const cost = normalized[ii][j];
                    if (be > cost) be = cost;
                    if (wo < cost) wo = cost;
                } else {
                    throw new Error("Data input not set up in TOPSIS module")
                }

            }
            best.push(be);
            worst.push(wo);
        }

        // console.log({best, worst})

        const performanceScores = [];
        for (let i = 0; i < normalized.length; i++) {
            let upper = 0;
            let lower = 0;
            for (let jj = 0; jj < normalized[i].length; jj++) {
                //calculate euclidian distance over recipe
                //upper: sum ( ( X[i][jj] - best[jj] ) ^ 2 )
                //lower: sum ( ( X[i][jj] - worst[jj] ) ^ 2 )
                upper += Math.pow(normalized[i][jj] - best[jj], 2)
                lower += Math.pow(normalized[i][jj] - worst[jj], 2)
            }
            //calculate final performance score
            //lower / ( upper + lower )
            performanceScores.push(lower / (upper + lower))
        }

        //output: the decided meals as a list ordered from highest to lowest performance score up to qty
        const scoreMap: {[key:string]: number} = {};
        for(let i = 0; i < filteredData.index.length; i++){
            scoreMap[filteredData.index[i]] = performanceScores[i];
        }

        const recipes = filteredData.index.sort((a, b) => scoreMap[b] - scoreMap[a]).slice(0, qty);

        // console.log({recipes, scoreMap})

        return recipes;
    }
}