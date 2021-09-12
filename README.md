# EasyDatabase (SQLite3)

- Very useful SQLite3 helper for Node.JS

## First of all

- Install `better-sqlite3` using `npm i better-sqlite3`

## Creating a database instance

```js
const EasyDatabase = require("./EasyDatabase");
const db = new EasyDatabase("data"); // will be data.sqlite
```

## Adding required things

```js
const {
    IntegerColumn, BigColumn, NullColumn, RealColumn,
    StringColumn, WhereCondition
} = EasyDatabase;
```

## Creating tables

### First way (Recommended)

```js
db.createTable("otherTable", [
    new IntegerColumn({
        name: "id",
        isNotNull: true,
        def: null, // default* (null = no default value, because it has auto increment so no need)
        isPrimaryKey: true,
        autoIncrement: true
    }),
    new StringColumn({
        name: "name",
        isNotNull: true
    }),
    new IntegerColumn.TinyIntegerColumn({
        name: "age",
        isNotNull: true
    })
]);
```

### Second way(Not recommended)

```js
db.createTable("myTable", [
    new IntegerColumn("id", true, null, true, true), // they can create column like that
    new StringColumn("name", true),
    new IntegerColumn.TinyIntegerColumn("age", true)
]);
```

## Pushing new rows

```js
db.push("myTable", {
    name: "John",
    age: 17
});

// lets add a friend for John
db.push("myTable", {
    name: "Jack",
    age: 18
});
```

## Fetching row

```js
const JohnData = db.get("myTable", [
    new WhereCondition(
        "name",
        WhereCondition.EQUALS,
        "John"
    )
])[0];
console.log(JohnData); // { "id": 1, "name": "John", "age": 17 }
```

## Changing column values for rows

```js
db.set("myTable", [
    new WhereCondition(
        "name",
        WhereCondition.EQUALS,
        "John"
    )
], "name", "NewJohn");
// now John's name is NewJohn in his row
```

## Fetching all rows in a table

```js
const myTable = db.fetchTable("myTable");
console.log(myTable);
/*
Result:
[
    {
        "id": 1,
        "name": "NewJohn",
        "age": 17
    },
    {
        "id": 2,
        "name": "Jack",
        "age": 18
    }
]
*/
```

## Removing rows from tables

```js
db.removeRow("myTable", [
    new WhereCondition(
        "name",
        WhereCondition.EQUALS,
        "Jack"
    )
]); // removed Jack's row *rip*
```

## Removing tables

```js
db.removeTable("myTable"); // removed table

// *rest in peace brand new myTable*
```

********************

# Column Types

- What is ColumnKeyObject?
    - ColumnKeyObject is an object that includes column's keys. Example for NullColumn's ColumnKeyObject: `{name: "test", isPrimaryKey: true}` or `{name: "test"}` etc.

## Column

- Base column class

```js
EasyDatabase.Column (name: string | ColumnKeyObject, type: string, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?)
```

### NullColumn

- Null type column

```js
EasyDatabase.NullColumn extends Column (name: string | ColumnKeyObject, isPrimaryKey: boolean?)
```

### IntegerColumn

- Number type column

```js
EasyDatabase.IntegerColumn extends Column (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?, autoIncrement = boolean?, customType: string?, customName: string?)
```

#### TinyIntegerColumn

- Number type column
- If it is signed value should be between -128 and 127 if it's not signed value should be between 0 and 255.

```js
EasyDatabase.IntegerColumn.TinyIntegerColumn extends IntegerColumn (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?, autoIncrement: boolean?, signed: boolean?)
```

#### SmallIntegerColumn

- Number type column
- If it is signed value should be between -32768 and 32767 if it's not signed value should be between 0 and 65535.

```js
EasyDatabase.IntegerColumn.SmallIntegerColumn extends IntegerColumn (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?, autoIncrement: boolean?, signed: boolean?)
```

#### MediumIntegerColumn

- Number type column
- If it is signed value should be between -8388608 and 8388607 if it's not signed value should be between 0 and 16777215.

```js
EasyDatabase.IntegerColumn.MediumIntegerColumn extends IntegerColumn (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?, autoIncrement: boolean?, signed: boolean?)
```

#### MediumIntegerColumn

- Number type column
- If it is signed value should be between -8388608 and 8388607 if it's not signed value should be between 0 and 16777215.

```js
EasyDatabase.IntegerColumn.MediumIntegerColumn extends IntegerColumn (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?, autoIncrement: boolean?, signed: boolean?)
```

#### INTColumn

- Number type column
- If it is signed value should be between -2147483648 and 2147483648 if it's not signed value should be between 0 and 4294967295.

```js
EasyDatabase.IntegerColumn.INTColumn extends IntegerColumn (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?, autoIncrement: boolean?, signed: boolean?)
```

#### BigIntegerColumn

- Number type column
- If it is signed value should be between -9223372036854775808 and 9223372036854775807 if it's not signed value should be between 0 and 18446744073709551615.

```js
EasyDatabase.IntegerColumn.BigIntegerColumn extends IntegerColumn (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?, autoIncrement: boolean?, signed: boolean?)
```

### RealColumn

- Float type column

```js
EasyDatabase.RealColumn extends Column (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?)
```

### StringColumn

- String type column

```js
EasyDatabase.StringColumn extends Column (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?)
```

### BigColumn

- It can be everything and it can be as long as you want!

```js
EasyDatabase.BigColumn extends Column (name: string | ColumnKeyObject, isNotNull: boolean?, default: boolean?, isPrimaryKey: boolean?)
```

********************

# Where Condition Types

- EasyDatabase.WhereCondition.EQUALS (==)
- EasyDatabase.WhereCondition.SMALLER (<)
- EasyDatabase.WhereCondition.SMALLER_OR_EQUALS (<=)
- EasyDatabase.WhereCondition.BIGGER (>)
- EasyDatabase.WhereCondition.BIGGER_OR_EQUALS (>=)
- EasyDatabase.WhereCondition.NOT_EQUALS (!=)
- EasyDatabase.WhereCondition.IN (IN)
- EasyDatabase.WhereCondition.NOT_IN (NOT IN)
- EasyDatabase.WhereCondition.BETWEEN (BETWEEN)
- EasyDatabase.WhereCondition.IS (IS)
- EasyDatabase.WhereCondition.IS_NOT (IS NOT)

**************

# Misc

## Execute/query things manually

```js
db.execute(`INSERT INTO table (a, b) VALUES (1, 2)`);
console.log(db.query(`SELECT * FROM table`));
```

## Options for database

- Where are options?
  - While creating new instance of EasyDatabase you can add options, example: `new EasyDatabase("databaseName", {myOption: "myValue", myOtherOption: "myOtherValue"})`

### Debug Mode

- It logs executions and queries to console
- To enable it add debug: true

```js
new EasyDatabase("data", {
    debug: true
});
```

### Toggle SQLite Crashes

- If you make it false it will only log sqlite errors to console
- To enable it add sqliteCrashes: true

```js
new EasyDatabase("data", {
    sqliteCrashes: true
});
```
