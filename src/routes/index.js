const models = require('../models');
const express = require('express');
const router = express.Router();
const fs = require('fs');

const {externalServices} = require('../services/BaseService');

Object.keys(models).filter((m) => {
  return models[m]._isExternalResource &&
    m.toLowerCase() !== 'sequelize'
}).forEach(function (m) {

  let r = `/${m.toLowerCase()}`;

  //get by id
  router.get(`${r}/:model_id`, function (req, res) {
    models[m].findById(req.params.model_id).then(function (recs) {
      res.json(recs);
    }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });
  });

  //get all
  router.post(`${r}/all`, function (req, res) {
    let params = Object.assign({raw: true}, req.body || {});
    models[m].findAll(params).then(function (recs) {
      res.json(recs);
    }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });

  });
  //get all (sem filtros)
  router.get(`${r}/`, function (req, res) {

    models[m].findAll().then(function (recs) {
      res.json(recs);
    }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });

  });

  //post
  router.post(`${r}/`, function (req, res) {
    models[m].create(req.body).then(function (rec) {
      let result = Object.assign(rec, {success: true});
      res.json(result);
    }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });
  });

  //patch
  router.patch(`${r}/:model_id`, function (req, res) {
    models[m].findById(req.params.model_id).then(function (rec) {

      if (!rec) throw "Registro não encontrado";

      rec.update(req.body).then(function (updated) {
        let result = Object.assign(updated, {success: true});
        res.json(result);
      });
    }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });
  });

  //delete
  router.delete(`${r}/:model_id`, function (req, res) {
    models[m].destroy({
      where: {
        id: req.params.model_id
      }
    }).then(function () {
      res.json({ok: true});
    }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });
  });

});

for (let srv in externalServices()) {
  const srvCls = externalServices()[srv];
  const r = `/${ srv.toLowerCase().replace('service', '') }`;
  router.get(`${r}/:route_id`, function (req, res) {

    let instSrv = new srvCls();
    instSrv.execHttpMethod("GET", {params: req.params, query: req.query})
      .then(function (ret) {
        res.json(Object.assign(ret, {success: true}));
      }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });

  });
  router.post(`${r}/`, function (req, res) {

    let instSrv = new srvCls();
    let prm = instSrv.execHttpMethod("POST", {
      params: req.params,
      body: req.body,
      query: req.query
    });
    prm.then(function (ret) {
      res.json(Object.assign(ret, {success: true}));
    }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });

  });
  router.delete(`${r}/`, function (req, res) {

    let instSrv = new srvCls();
    instSrv.execHttpMethod("DELETE", {params: req.params, query: req.query})
      .then(function (ret) {
        res.json(Object.assign(ret, {success: true}));
      }).catch(function (err) {
      res.json({
        success: false,
        error: err
      });
    });
  });

}

module.exports = router;
