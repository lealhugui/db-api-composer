const Sequelize = require("sequelize");

/**
 * Construtor base para as models.
 * @param sequelize instancia base do Sequelize
 * @param modelName nome da model
 * @param definitions campos
 * @param diffTableName nome da tabela no banco (opcional). caso nao informado, sera usado o nome da model.
 * @param indexes indices especiais (opcional)
 * @param isExternalResource parametro para exposição da model via API REST
 */
exports.Model = function (sequelize, modelName, definitions, diffTableName=null,
                          indexes=null, isExternalResource=true) {
  // Configurações basicas para as models do SequelizeJS.
  let opt = {
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    schema: 'pdv-va'
  };
  // Configuro o nome da tabela no banco (caso tiver sido informada)
  if (diffTableName !== null) {
    opt.tableName = diffTableName;
  }
  // Caso a model possua algum indice especifico.
  if (indexes !== null) {
    opt.indexes = indexes;
  }

  /* Caso tenham sido declaradas FKs diretamente nos campos , eu construo as associations
  dinamicamente na model.
    ** AVISO **: usar fks nos campos sobreescreve qualquer associations que houverem sido declaradas explicitamente.
      Essas duas APIS se sobreescrevem e resultam na mesma coisa, portanto, use uma OU outra.
   */
  let fks = [];
  for(let d in definitions){
    if(definitions[d].hasOwnProperty('references')){
      fks.push(d);
    }
  }

  let result = sequelize.define(modelName, definitions, opt);

  if(fks.length>0) {
    result.associations = function(models){
      for(let i in fks){
        const k = fks[i];
        const thisF = definitions[k];
        const fkOpts = fk(k, thisF.hasOwnProperty('allowNull') ? !thisF.allowNull : false);
        result.belongsTo(models[thisF.references.proxyModel], fkOpts);
      }
    }
  }
  // fim do processamento de FKs

  // Configuração se a model pode/será exposta na api REST dinamicamente.
  result._isExternalResource = isExternalResource;
  return result;

};

/**
 * Sintatic sugar para criação de fields da model como FKs.
 * ** AVISO **: usar fks nos campos sobreescreve qualquer associations que houverem sido declaradas explicitamente.
 *  Essas duas APIS se sobreescrevem e resultam na mesma coisa, portanto, use uma OU outra.
 * @param selfType tipo do campo.
 * @param tableName nome da tabela de referencia.
 * @param refFieldName nome do campo de referencia.
 * @param modelName nome da model de referencia (necessario para construção das associations).
 * @param notNull Se o campo aceita null ou não.
 * @returns {{type: *, references: {model: *, key: *, proxyModel: *}, allowNull: boolean}}
 */
exports.fkField = function (selfType, tableName, refFieldName, modelName, notNull=false) {
  let result = {
    type: selfType,
    references: {
      model: tableName,
      key: refFieldName,
      proxyModel: modelName
    },
    allowNull: !notNull
  };
  return result;
};

/**
 * Sintatic Sugar para criação de campos data_inclusao e data_alteração
 * @param notNull Se o campo deve aceitar null.
 * @returns {{type: *}}
 */
exports.dataLogType = function (notNull = false) {
  let result = {type: Sequelize.DATEONLY};
  result.allowNull = !notNull;
  if(notNull)
    result.defaultValue = Sequelize.NOW;
  return result;
};

const usrBase = function(notNull=false){
  let result = {
    type: Sequelize.STRING(50),
    allowNull: !notNull
  }
  return result;
};

/**
 * Field padrão para o campo 'usuario_inclusao'
 */
exports.usrInclusaoType = usrBase(true);
/**
 * Field padrão para o campo 'usuario_alteracao'
 */
exports.usrAlteracaoType = usrBase();

/**
 * Sintatic sugar para criação de campos numericos
 * @param precision
 * @param scale
 * @param notNull
 * @param defaultV
 * @returns {{type: *}}
 */
exports.defaultNumeric = function (precision = 0, scale = 0, notNull = false, defaultV = null) {
  let result = {type: Sequelize.NUMERIC};
  if (precision > 0 || scale > 0) result.type = Sequelize.NUMERIC(precision, scale);
  if (defaultV !== null) result.defaultValue = defaultV;
  result.allowNull = !notNull;

  return result;
};

/**
 * Sintatic sugar para criação de campos not null
 * @param type
 * @returns {{type: *, allowNull: boolean}}
 */
exports.notNull = function (type, defValue=null) {
  const result =  {
    type: type,
    allowNull: false
  };
  if(defValue!==null)
    result.defaultValue = defValue;
  return result;
};

/**
 * Sintatic sugar para definição de campos referentes em associations.
 * @example Model.belongsTo(OtherModel, fk('OtherModelFieldId'));
 * @param fieldName
 * @param notNull
 * @returns {{foreignKey: *}}
 */
const fk = function (fieldName, notNull = false) {
  let result = {
    foreignKey: fieldName
  };
  result.allowNull = !notNull;
  return result;
};
exports.fk = fk;
