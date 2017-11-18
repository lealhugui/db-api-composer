const models = require('../models');
const fs = require('fs');

function getDefaultContext() {
    return {
        transaction: null
    };
}

class NotImplementedError extends Error {
    constructor(message = "Not Implemented") {
        super(message);
    }
}

exports.NotImplementedError = NotImplementedError;

class ServiceError extends Error {
    constructor(message = "Service Error") {
        super(message);
    }
}

exports.ServiceError = ServiceError;


/**
 * Abstract Base Service Class. Define methods for basic model, context and service management.
 */
class AbstractService {

    constructor(context = null) {
        this.ctx = null;
        this._init(context);
    }

    _getMdlInstance(modelName, modelId = null) {
        return new Promise((resolve, reject) => {
            reject((new NotImplementedError()).toString());
        });
    }

    _getMdlRecordSet(modelName, where) {
        return new Promise((resolve, reject) => {
            reject((new NotImplementedError()).toString());
        });
    }

    _saveMdlInstance(modelName, data) {
        return new Promise((resolve, reject) => {
            reject((new NotImplementedError()).toString());
        });
    }

    _createMdlInstance(modelName, data) {
        return new Promise((resolve, reject) => {
            reject((new NotImplementedError()).toString());
        });
    }

    _getService(serviceName, context = null) {
        if (!services.hasOwnProperty(serviceName))
            throw new ServiceError("Service not found")
        return new (services[serviceName])(context);
    }

    _init(context) {
        if (context === null) {
            this.ctx = getDefaultContext();
        } else {
            this.ctx = context;
        }
    }
}

/**
 * Transactional service class.
 * If no context is passed over the constructor, a new context is created.
 */
class TransactionalSercice extends AbstractService {

    _init(context) {
        super._init(context);
        if (this.ctx.transaction === null)
            this.ctx.transaction = models.sequelize.transaction();
    }

    _getMdlInstance(modelName, modelId = null) {
        if (modelId = null) return new models[modelName]();

        return this.ctx.transaction.then(function (t) {
            return models[modelName].findById(modelId, {transaction: t});
        });
    }

    _getMdlRecordSet(modelName, where) {
        return this.ctx.transaction.then(function (t) {
            return models[modelName].findAll(where, {transaction: t});
        });
    }

    _createMdlInstance(modelName, data) {
        return this.ctx.transaction.then(function (t) {
            return models[modelName].create(data, {transaction: t});
        });
    }

    _saveMdlInstance(modelName, data) {
        return this.ctx.transaction.then(function (t) {
            return models[modelName].update(data, {transaction: t});
        });
    }
}

exports.TransactionalSercice = TransactionalSercice;

/**
 * Class for exposing TransactionalSercices through a REST interface. Provides methods for implementing actions according HTTP verbs (currently POST|GET|DELETE)
 */
class ExternalTransactionalService extends TransactionalSercice {

    _doPost(opt) {
        return new Promise((resolve, reject) => {
            reject((new NotImplementedError()).toString());
        });
    }

    _doGet(opt) {
        return new Promise((resolve, reject) => {
            reject((new NotImplementedError()).toString());
        });
    }

    _doDelete(opt) {
        return new Promise((resolve, reject) => {
            reject((new NotImplementedError()).toString());
        });
    }

    execHttpMethod(httpMethod, opt) {
        switch (httpMethod) {
            case "GET":
                return new Promise((resolve, reject) => {
                    this.ctx.transaction.then((t) => {
                        this._doGet(opt).then((data) => {
                            t.commit().then(function (o) {
                                resolve(data);
                            });
                        }).catch((e) => {
                            t.rollback().then(function (o) {
                                reject(e.toString());
                            });
                        });
                    });
                });
                break;
            case "POST":
                return new Promise((resolve, reject) => {
                    this.ctx.transaction.then((t) => {
                        this._doPost(opt).then((data) => {
                            t.commit().then(function (o) {
                                resolve(data);
                            });
                        }).catch((e) => {
                            t.rollback().then(function (o) {
                                reject(e.toString());
                            });
                        });
                    });
                });
                break;
            case "DELETE":
                return new Promise((resolve, reject) => {
                    this.ctx.transaction.then((t) => {
                        this._doDelete(opt).then((data) => {
                            t.commit().then(function (o) {
                                resolve(data);
                            });
                        }).catch((e) => {
                            t.rollback().then(function (o) {
                                reject(e.toString());
                            });
                        });
                    });
                });
                break;
            default:
                throw NotImplementedError();
        }
    }
}

exports.ExternalTransactionalService = ExternalTransactionalService;


const services = {};

fs
    .readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf(".") !== 0) &&
            (file !== "index.js") &&
            (file !== "BaseService.js");
    })
    .forEach((file) => {
        let path = `./${file.replace('.js', '')}`;
        const service = require(path);
        services[service.name] = service;
    })
;

exports.services = () => {
    return services;
};
exports.externalServices = () => {
    const {ExternalTransactionalService} = require('./BaseService');
    const externals = {};
    for (let s in services) {
        if (services[s].prototype instanceof ExternalTransactionalService)
            externals[s] = services[s];
    }
    return externals;
};
