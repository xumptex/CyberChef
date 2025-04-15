/**
 * @author xumptex [xumptex@outlook.fr]
 * @copyright Crown Copyright 2025
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";
import { strToValue } from "../lib/Borsh.mjs";
import * as borsh from "borsh";
/**
 * Borsh Decoding operation
 */
class BorshDecoding extends Operation {

    /**
     * BorshDecoding constructor
     */
    constructor() {
        super();

        this.name = "Borsh Decoding";
        this.module = "Default";
        this.description = `Decoding a buffer into borsh using a configurable schema :\n 
        
Basic Types Basic types are described by a string. The following types are supported:\n

    u8, u16, u32, u64, u128 - unsigned integers of 8, 16, 32, 64, and 128 bits respectively.\n
    i8, i16, i32, i64, i128 - signed integers of 8, 16, 32, 64, and 128 bits respectively.\n
    f32, f64 - IEEE 754 floating point numbers of 32 and 64 bits respectively.\n
    bool - boolean value.\n
    string - UTF-8 string.\n

Arrays, Options, Maps, Sets, Enums, and Structs\n

More complex objects are described by a JSON object. The following types are supported:\n

    { array: { type: Schema, len?: number } } - an array of objects of the same type. The type of the array elements is described by the type field. 
    If the field len is present, the array is fixed-size and the length of the array is len. Otherwise, the array is dynamic-sized and the length of the array is serialized before the elements. \n
    { option: Schema } - an optional object. The type of the object is described by the type field.\n
    { map: { key: Schema, value: Schema }} - a map. The type of the keys and values are described by the key and value fields respectively.\n
    { set: Schema } - a set. The type of the elements is described by the type field.\n
    { enum: [ { struct: { className1: structSchema1 } }, { struct: { className2: structSchema2 } }, ... ] } - an enum. The variants of the enum are described by the className1, className2, etc. fields. The variants are structs.\n
    { struct: { field1: Schema1, field2: Schema2, ... } } - a struct. The fields of the struct are described by the field1, field2, etc. fields.`;
        this.infoURL = "https://borsh.io/";
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {
                "name": "Schema",
                "type": "text",
                "value": ""
            }
        ];
    }

    /**
     * @param {string} input
     * @param {Object[]} args
     * @returns {string}
     */
    run(input, args) {
        const schema = strToValue(args[0]);
        let result = ""
        try {
            result = JSON.stringify(borsh.deserialize(schema, strToValue(input)));
        }catch (e){
            throw new OperationError(e.message);
        }
        return result;
    }

}

export default BorshDecoding;
