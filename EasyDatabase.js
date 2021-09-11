class EasyDatabase {
    constructor(file) {
        this._sqlite = require("better-sqlite3")("./" + file.replace(/\.sqlite/g, "") + ".sqlite");
    }
    getSqlite() {
        return this._sqlite;
    }
    execute(sql) {
        this.getSqlite().exec(sql);
        return this;
    }
    query(sql) {
        return this.getSqlite().prepare(sql).all();
    }
    createTable(name = "", columns = [], ifNotExists = true) {
        if(!name || typeof name !== "string") throw new Error("Name should be valid string!");
        if(!Array.isArray(columns)) throw new Error("Columns parameter should be an array!");
        if(columns.some(i=> typeof i !== "object" || !(i instanceof EasyDatabase.Column))) throw new Error("Columns should be a Column instance!");
        return this.execute(`CREATE TABLE ${ifNotExists ? "IF NOT EXISTS " : ""}${name} (${columns.map(i=> i.encode()).join(",")})`);
    }
    push(table = "", values = {}) {
        if(!table || typeof table !== "string") throw new Error("Name should be valid string!");
        if(typeof values !== "object") throw new Error("Values should be an object!");
        return this.execute(`INSERT INTO ${table} (${Object.keys(values).join(",")}) VALUES (${Object.values(values).map(i => JSON.stringify(i)).join(",")})`);
    }
    get(table = "", whereConditions = [], select = ["*"], all = false) {
        if(!table || typeof table !== "string") throw new Error("Table name should be valid string!");
        if(!Array.isArray(whereConditions)) throw new Error("Where conditions parameter should be an array!");
        if(whereConditions.some(i=> typeof i !== "object" || !(i instanceof EasyDatabase.WhereCondition))) throw new Error("Where conditions should be a WhereCondition instance!");
        if(!Array.isArray(select)) throw new Error("Select parameter should be an array!");
        if(select.length <= 0) throw new Error("Select should have at least one element!");
        if(select.some(i=> typeof i !== "string")) throw new Error("Select should be an array with strings!");
        const res = this.query(`SELECT ${select.join(",")} FROM ${table}${whereConditions.length > 0 ? " WHERE " : ""}${whereConditions.map(i=> i.encode()).join(",")}`);
        return select.length === 1 && select[0] !== "*" && !all ? res.map(i=> Object.values(i)[0]) : res;
    }
    fetchTable(table = "") {
        return this.get(table);
    }
    set(table = "", column, value) {
        if(!table || typeof table !== "string") throw new Error("Table name should be valid string!");
        if(typeof column !== "object" || !(column instanceof EasyDatabase.Column)) throw new Error("Column should be a Column instance!");
        return this.execute(`UPDATE ${table} SET ${column} = ${JSON.stringify(value)}`);
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
        return this.execute(`DELETE FROM ${table} WHERE ${whereConditions.map(i=> i.encode()).join(",")}`);
    }
}
EasyDatabase.Column = class Column {
    constructor(name, type, isNotNull, def, isPrimaryKey) {
        this._name = name;
        this._type = type;
        this._default = def;
        this._isNotNull = isNotNull;
        this._isPrimaryKey = isPrimaryKey;
    }
    encode() {
        return this._name + " " + this._type + " " + (this._isNotNull ? "NOT NULL " : "") + (this._default ? "DEFAULT " + JSON.stringify(this._default) : "") + (this._isPrimaryKey ? "PRIMARY KEY " : "");
    }
}
EasyDatabase.NullColumn = class NullColumn extends Column {
    constructor(name = "", isPrimaryKey = false) {
        super(name, "NULL", false, null, isPrimaryKey);
    }
}
EasyDatabase.IntegerColumn = class IntegerColumn extends Column {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, customType = "", customName = "") {
        if(def && typeof def !== "number") throw new Error((customName || "Integer") + " column should have number as default");
        super(name, customType || "INTEGER", isNotNull, def, isPrimaryKey);
    }
}
EasyDatabase.IntegerColumn.TinyIntegerColumn = class TinyIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, signed = false) {
        const min = signed ? -128 : 0;
        const max = signed ? 127 : 255;
        super(name, isNotNull, def, isPrimaryKey, (signed ? "" : "UNSIGNED ") + "TINYINT", "Tiny integer");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("Tiny integer column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.SmallIntegerColumn = class SmallIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, signed = false) {
        const min = signed ? -32768 : 0;
        const max = signed ? 32767 : 65535;
        super(name, isNotNull, def, isPrimaryKey, (signed ? "" : "UNSIGNED ") + "SMALLINT", "Small integer");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("Small integer column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.MediumIntegerColumn = class MediumIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, signed = false) {
        const min = signed ? -8388608 : 0;
        const max = signed ? 8388607 : 16777215;
        super(name, isNotNull, def, isPrimaryKey, (signed ? "" : "UNSIGNED ") + "MEDIUMINT", "Medium integer");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("Medium integer column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.INTColumn = class INTColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, signed = false) {
        const min = signed ? -2147483648 : 0;
        const max = signed ? 2147483648 : 4294967295;
        super(name, isNotNull, def, isPrimaryKey, (signed ? "" : "UNSIGNED ") + "INT", "INT");
        if(def && (def < min || def > max || def !== Math.floor(def))) throw new Error("INT column should be "+min+" to "+max+".");
    }
}
EasyDatabase.IntegerColumn.BigIntegerColumn = class BigIntegerColumn extends IntegerColumn {
    constructor(name = "", isNotNull = false, def = 0, isPrimaryKey = false, signed = false) {
        const min = signed ? -9223372036854775808 : 0;
        const max = signed ? 9223372036854775807 : 18446744073709551615;
        super(name, isNotNull, def, isPrimaryKey, (signed ? "" : "UNSIGNED ") + "BIGINT", "Big integer");
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
        return this._column + " " + this._operator + " " + JSON.stringify(this._value);
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