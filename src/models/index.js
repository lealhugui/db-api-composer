"use strict";

let fs        = require("fs");
let path      = require("path");
let Sequelize = require("sequelize");
let env       = process.env.NODE_ENV || "development";
let config    = require(path.join(__dirname, '..', 'config.json'))[env];
let sequelize = null;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL,config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
let db        = {};
fs.readdirSync(__dirname)
  .filter(function(file) {
    /*
      Excluo os arquivos 'ocultos' (inicidos por '.'), este proprio arquivo (index.js) e os arquivos com
      definições de Enums.
     */
    return (file.indexOf(".") !== 0) &&
           (file !== "index.js") &&
           (file.toLowerCase().indexOf("enum") === -1) &&
           (file.toLowerCase().indexOf("helper") === -1);
  })
  .forEach(function(file) {
    let f = path.join(__dirname, file);
    let model = null;
    try {
      model = sequelize.import(f);
    } catch (err){
      throw `Erro ao importar model ${f}:\n${err}`;
    }
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ("associations" in db[modelName]) {
    if(!isObjVazio(db[modelName]) && typeof db[modelName].associations === 'function'){
      db[modelName].associations(db);
    }
  }
});

function isObjVazio(obj){
  return Object.keys(obj).length === 0 &&
    obj.constructor === Object;
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
