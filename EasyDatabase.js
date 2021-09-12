const stringify = (str) => {
    let res = JSON.stringify(str);
    if(res.charAt(0) === '"') res = res.replace('"', "'");
    if(res.charAt(res.length-1) === '"') res = [...res].slice(0, res.length-1).join("") + "'";
    return res;
}

class EasyDatabase {
    constructor(file, options = {}) {
        const k = Object.keys(options);
        this._debug = k.includes("debug") ? options.debug : false;
        this._sqliteCrashes = k.includes("debug") ? options["sqliteCrashes"] : false;
        this._sqlite = require("better-sqlite3")("./" + file.replace(/\.sqlite/g, "") + ".sqlite");
    }
    getSqlite() {
        return this._sqlite;
    }
    execute(sql) {
        if(this._debug) console.log("[DEBUG] EXECUTE: " + sql);
        try {
            this.getSqlite().exec(sql);
        } catch (e) {
            if(this._sqliteCrashes) throw e;
            console.error(e);
        }
        return this;
    }
    query(sql) {
        if(this._debug) console.log("[DEBUG] QUERY: " + sql);
        try {
            return this.getSqlite().prepare(sql).all();
        } catch (e) {
            if(this._sqliteCrashes) throw e;
            console.error(e);
            return [];
        }
    }
    createTable(name = "", columns = [], ifNotExists = true) {
        if(!name || typeof name !== "string") throw new Error("Name should be valid string!");
        if(!Array.isArray(columns)) throw new Error("Columns parameter should be an array!");
        if(columns.some(i=> typeof i !== "object" || !(i instanceof EasyDatabase.Column))) throw new Error("Columns should be a Column instance!");
        return this.execute(`CREATE TABLE ${ifNotExists ? "IF NOT EXISTS " : ""}${name} (${columns.map(i=> i.encode()).join(", ")})`);
    }
    push(table = "", values = {}) {
        if(!table || typeof table !== "string") throw new Error("Name should be valid string!");
        if(typeof values !== "object") throw new Error("Values should be an object!");
        return this.execute(`INSERT INTO ${table} (${Object.keys(values).join(", ")}) VALUES (${Object.values(values).map(i => stringify(i)).join(", ")})`);
    }
    get(table = "", whereConditions = [], select = ["*"], all = false) {
        if(!table || typeof table !== "string") throw new Error("Table name should be valid string!");
        if(!Array.isArray(whereConditions)) throw new Error("Where conditions parameter should be an array!");
        if(whereConditions.some(i=> typeof i !== "object" || !(i instanceof EasyDatabase.WhereCondition))) throw new Error("Where conditions should be a WhereCondition instance!");
        if(!Array.isArray(select)) throw new Error("Select parameter should be an array!");
        if(select.length <= 0) throw new Error("Select should have at least one element!");
        if(select.some(i=> typeof i !== "string")) throw new Error("Select should be an array with strings!");
        const res = this.query(`SELECT ${select.join(", ")} FROM ${table}${whereConditions.length > 0 ? " WHERE " : ""}${whereConditions.map(i=> i.encode()).join(", ")}`);
        return select.length === 1 && select[0] !== "*" && !all ? res.map(i=> Object.values(i)[0]) : res;
    }
    fetchTable(table = "") {
        return this.get(table);
    }
    set(table = "", whereConditions = [], column, value) {
        if(!table || typeof table !== "string") throw new Error("Table name should be valid string!");
        if(!Array.isArray(whereConditions)) throw new Error("Where conditions parameter should be an array!");
        if(whereConditions.some(i=> typeof i !== "object" || !(i instanceof EasyDatabase.WhereCondition))) throw new Error("Where conditions should be a WhereCondition instance!");
        return this.execute(`UPDATE ${table} SET ${column} = ${stringify(value)} WHERE ${whereConditions.map(i=> i.encode()).join(", ")}`);
    }
    removeTable(table = "") {
        if(!table || typeof table !== "string") throw new Error("Table name should be valid string!");
        return this.execute(`DROP TABLE ${table}`);
    }
    removeRow(table = "", whereConditions = []) {
        if(!table || typeof table !== "string") throw new Error("Table name should be valid string!");
        if(!Array.isArray(whereConditions)) throw new Error("Where conditions parameter should be an array!");
        if(whereConditions.length <= 0) throw new Error("Where conditions should have at least one element!");
        if(whereConditions.some(i=> typeof i !== "object" || !(i instanceof EasyDatabase.WhereCondition))) throw new Error("Where conditions should be a WhereCondition instance!");
        return this.execute(`DELETE FROM ${table} WHERE ${whereConditions.map(i=> i.encode()).join(", ")}`);
    }
}
class Column {
    constructor(name, type, isNotNull, def, isPrimaryKey) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            def = name["def"];
            name = name["name"];
        }
        this._name = name;
        this._type = type;
        this._default = def;
        this._isNotNull = isNotNull;
        this._isPrimaryKey = isPrimaryKey;
    }
    encode(extra = "") {
        let list = [this._name, this._type];
        if(this._isNotNull) list.push("NOT NULL");
        if(this._default) list.push("DEFAULT " + stringify(this._default));
        if(this._isPrimaryKey) list.push("PRIMARY KEY");
        if(extra) list.push(extra);
        return list.join(" ");
    }
}
EasyDatabase.Column = Column;
EasyDatabase.NullColumn = class NullColumn extends Column {
    constructor(name = "", isPrimaryKey = false) {
        super(name, "NULL", false, null, isPrimaryKey);
    }
}
class IntegerColumn extends Column {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, autoIncrement = false, customType = "", customName = "") {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            autoIncrement = name["autoIncrement"];
            customType = name["customType"];
            customName = name["customName"];
            def = name["def"];
            name = name["name"];
        }
        if(def && typeof def !== "number") throw new Error((customName || "Integer") + " column should have number as default");
        super(name, customType || "INTEGER", isNotNull, def, isPrimaryKey);
        this._autoIncrement = autoIncrement;
    }
    encode() {
        return super.encode(this._autoIncrement ? "AUTOINCREMENT" : "");
    }
}
EasyDatabase.IntegerColumn = IntegerColumn;
EasyDatabase.IntegerColumn.TinyIntegerColumn = class TinyIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, autoIncrement = false, signed = false) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            autoIncrement = name["autoIncrement"];
            def = name["def"];
            name = name["name"];
        }
        const min = signed ? -128 : 0;
        const max = signed ? 127 : 255;
        super(name, isNotNull, def, isPrimaryKey, autoIncrement, (signed ? "" : "UNSIGNED ") + "TINYINT", "Tiny integer");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("Tiny integer column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.SmallIntegerColumn = class SmallIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, autoIncrement = false, signed = false) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            autoIncrement = name["autoIncrement"];
            def = name["def"];
            name = name["name"];
        }
        const min = signed ? -32768 : 0;
        const max = signed ? 32767 : 65535;
        super(name, isNotNull, def, isPrimaryKey, autoIncrement, (signed ? "" : "UNSIGNED ") + "SMALLINT", "Small integer");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("Small integer column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.MediumIntegerColumn = class MediumIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, autoIncrement = false, signed = false) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            autoIncrement = name["autoIncrement"];
            def = name["def"];
            name = name["name"];
        }
        const min = signed ? -8388608 : 0;
        const max = signed ? 8388607 : 16777215;
        super(name, isNotNull, def, isPrimaryKey, autoIncrement, (signed ? "" : "UNSIGNED ") + "MEDIUMINT", "Medium integer");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("Medium integer column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.INTColumn = class INTColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, autoIncrement = false, signed = false) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            autoIncrement = name["autoIncrement"];
            def = name["def"];
            name = name["name"];
        }
        const min = signed ? -2147483648 : 0;
        const max = signed ? 2147483648 : 4294967295;
        super(name, isNotNull, def, isPrimaryKey, autoIncrement, (signed ? "" : "UNSIGNED ") + "INT", "INT");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("INT column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.BigIntegerColumn = class BigIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, autoIncrement = false, signed = false) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            autoIncrement = name["autoIncrement"];
            def = name["def"];
            name = name["name"];
        }
        const min = signed ? -9223372036854775808 : 0;
        const max = signed ? 9223372036854775807 : 18446744073709551615;
        super(name, isNotNull, def, isPrimaryKey, autoIncrement, (signed ? "" : "UNSIGNED ") + "BIGINT", "Big integer");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("Big integer column should be "+min+" to "+max+".");
    }
}
/*
INT
TINYINT
SMALLINT
MEDIUMINT
BIGINT
UNSIGNED BIG INT
INT2
INT8
*/
EasyDatabase.RealColumn = class RealColumn extends Column {
    constructor(name = "", isNotNull = false, def = 0.0, isPrimaryKey = false) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            def = name["def"];
            name = name["name"];
        }
        if(def && typeof def !== "number") throw new Error("Real column should have float as default");
        super(name, "REAL", isNotNull, def, isPrimaryKey);
    }
}
/*
DOUBLE
DOUBLE PRECISION
FLOAT
*/
EasyDatabase.StringColumn = class StringColumn extends Column {
    constructor(name = "", isNotNull = false, def = "", isPrimaryKey = false) {
        if(typeof name === "object") {
            isNotNull = name["isNotNull"];
            isPrimaryKey = name["isPrimaryKey"];
            def = name["def"];
            name = name["name"];
        }
        if(def && typeof def !== "string") throw new Error("String column should have string as default");
        super(name, "TEXT", isNotNull, def, isPrimaryKey);
    }
}
/*
CHARACTER(20)
VARCHAR(255)
VARYING CHARACTER(255)
NCHAR(55)
NATIVE CHARACTER(70)
NVARCHAR(100)
CLOB
*/
EasyDatabase.BigColumn = class BigColumn extends Column {
    constructor(name = "", isNotNull = false, def = "", isPrimaryKey = false) {
        super(name, "BLOB", isNotNull, def, isPrimaryKey);
    }
}
EasyDatabase.WhereCondition = class WhereCondition {
    constructor(column, operator, value) {
        this._column = column;
        this._operator = operator;
        this._value = value;
    }
    encode() {
        return this._column + " " + this._operator + " " + stringify(this._value);
    }
}
EasyDatabase.WhereCondition.EQUALS = "==";
EasyDatabase.WhereCondition.SMALLER = "<";
EasyDatabase.WhereCondition.SMALLER_OR_EQUALS = "<=";
EasyDatabase.WhereCondition.BIGGER = ">";
EasyDatabase.WhereCondition.BIGGER_OR_EQUALS = ">=";
EasyDatabase.WhereCondition.NOT_EQUALS = "!=";
EasyDatabase.WhereCondition.IN = "IN";
EasyDatabase.WhereCondition.NOT_IN = "NOT IN";
EasyDatabase.WhereCondition.BETWEEN = "BETWEEN";
EasyDatabase.WhereCondition.IS = "IS";
EasyDatabase.WhereCondition.IS_NOT = "IS NOT";

module.exports = EasyDatabase;
