const Sequelize = require("sequelize");

/**
 * Base model constructor.
 */
exports.Model = function (sequelize, modelName, definitions, diffTableName = null,
                          indexes = null, isExternalResource = true) {
    let opt = {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'pdv-va'
    };
    if (diffTableName !== null) {
        opt.tableName = diffTableName;
    }
    if (indexes !== null) {
        opt.indexes = indexes;
    }
    let fks = [];
    for (let d in definitions) {
        if (definitions[d].hasOwnProperty('references')) {
            fks.push(d);
        }
    }

    let result = sequelize.define(modelName, definitions, opt);

    if (fks.length > 0) {
        result.associations = function (models) {
            for (let i in fks) {
                const k = fks[i];
                const thisF = definitions[k];
                const fkOpts = fk(k, thisF.hasOwnProperty('allowNull') ? !thisF.allowNull : false);
                result.belongsTo(models[thisF.references.proxyModel], fkOpts);
            }
        }
    }

    result._isExternalResource = isExternalResource;
    return result;

};

exports.fkField = function (selfType, tableName, refFieldName, modelName, notNull = false) {
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

exports.dataLogType = function (notNull = false) {
    let result = {type: Sequelize.DATEONLY};
    result.allowNull = !notNull;
    if (notNull)
        result.defaultValue = Sequelize.NOW;
    return result;
};

const usrBase = function (notNull = false) {
    let result = {
        type: Sequelize.STRING(50),
        allowNull: !notNull
    }
    return result;
};

exports.usrInclusaoType = usrBase(true);

exports.usrAlteracaoType = usrBase();

exports.defaultNumeric = function (precision = 0, scale = 0, notNull = false, defaultV = null) {
    let result = {type: Sequelize.NUMERIC};
    if (precision > 0 || scale > 0) result.type = Sequelize.NUMERIC(precision, scale);
    if (defaultV !== null) result.defaultValue = defaultV;
    result.allowNull = !notNull;

    return result;
};

exports.notNull = function (type, defValue = null) {
    const result = {
        type: type,
        allowNull: false
    };
    if (defValue !== null)
        result.defaultValue = defValue;
    return result;
};

const fk = function (fieldName, notNull = false) {
    let result = {
        foreignKey: fieldName
    };
    result.allowNull = !notNull;
    return result;
};
exports.fk = fk;
