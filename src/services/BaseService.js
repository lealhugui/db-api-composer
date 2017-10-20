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
  constructor(message = "Erro do Serviço") {
    super(message);
  }
}
exports.ServiceError = ServiceError;


/**
 * Classe abstrata de Service. Define metodos base para gestao de models, contexto, e outros serviços.
 */
class AbstractService {

  constructor(context = null) {
    this.ctx = null;
    this._init(context);
  }

  /**
   * Retorna a instancia de uma model
   * Leva em conta o contexto do serviço.
   */
  _getMdlInstance(modelName) {
    return new Promise((resolve, reject) => {
      reject((new NotImplementedError()).toString())
    });
  }

  /**
   * Retorna uma Promise de um recordset de uma model.
   * Leva em conta o contexto do serviço.
   * @param modelName: nome da model
   * @param where: filtro de consulta
   */
  _getMdlRecordSet(modelName, where) {
    return new Promise((resolve, reject) => {
      reject((new NotImplementedError()).toString())
    });
  }

  /**
   * Salva uma instancia de uma model.
   * Levando em conta o contexto do serviço.
   * @param modelInstance: instancia da model
   */
  _saveMdlInstance(data) {
    return new Promise((resolve, reject) => {
      reject((new NotImplementedError()).toString())
    });
  }

  _createMdlInstance(modelName, data) {
    return new Promise((resolve, reject) => {
      reject((new NotImplementedError()).toString())
    });
  }

  /**
   * Intancia um serviço, passando o contexto atual como parametro.
   * @param serviceName Nome do serviço a ser instanciado.
   * @param context Contexto (para casos que o contexto precisa ser repassado)
   */
  _getService(serviceName, context = null) {
    if (!services.hasOwnProperty(serviceName))
      throw new ServiceError("Serviço não encontrado");
    return new (services[serviceName])(context);
  }

  async _getMdlById(modelName, modelId){
    throw new NotImplementedError();
  }

  /**
   * Metodo de construção do serviço.
   * @param context: contexto de execução do serviço (transação, sessao, etc)
   */
  _init(context) {
    if (context === null) {
      this.ctx = getDefaultContext();
      //this.ctx.transaction = models.sequelize.transaction();
    } else {
      this.ctx = context;
    }
  }
}

/**
 * Classe de serviço transacional. Caso nao seja instanciada passando um context, ira instanciar uma nova transação no contexto.
 */
class TransactionalService extends AbstractService {

  /**
   * Hook executado apos o tratamento do context da instancia do Service.
   * @private
   */
  _afterInit() {
    return;
  }

  _init(context) {
    super._init(context);
    if(this.ctx.transaction === null)
      this.ctx.transaction = models.sequelize.transaction();
    this._afterInit();
  }

  _getMdlInstance(modelName) {
    return new models[modelName]();
  }

  _getMdlRecordSet(modelName, where) {
    return this.ctx.transaction.then(function (t) {
      return models[modelName].findAll(where, {transaction: t});
    });
  }

  async _getMdlById(modelName, modelId){
    this.ctx.transaction.then(function (t) {
      let result = models[modelName].findById(modelId, {transaction: t})
      return result;
    });
  }

  _createMdlInstance(modelName, data) {
    return this.ctx.transaction.then(function (t) {
      return models[modelName].create(data, {transaction: t});
    });
  }

  _saveMdlInstance(data) {
    return this.ctx.transaction.then(function (t) {
      return data.save({transaction: t});
    });
  }
}
exports.TransactionalService = TransactionalService;

/**
 * Classe para exposição de TransactionalServices na interface REST. Fornece metodos para implementação de actions
 * de acordo com os metodos HTTP POST|GET|DELETE (devem ser sobreescritos para que sejam habilitados).
 */
class ExternalTransactionalService extends TransactionalService {

  _doPost(opt) {
    return new Promise((resolve, reject) => {
      reject((new NotImplementedError()).toString())
    });
  }

  _doGet(opt) {
    return new Promise((resolve, reject) => {
      reject((new NotImplementedError()).toString())
    });
  }

  _doDelete(opt) {
    return new Promise((resolve, reject) => {
      reject((new NotImplementedError()).toString())
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
        throw Error("Metodo não reconhecido");
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
    let service = require(path);
    services[service.name] = service;
  });

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
