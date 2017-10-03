let express = require('express');
let bodyParser = require('body-parser');
let fs        = require("fs");
let cors = require('cors')
let routes = require('./routes/index');

//instancio a APP
let app = express();

//middlewares
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));


//endpoints dinamicos (originados das models)
app.use('/api', routes);
let allRoutes = routes.stack;

//endpoints customizados
fs
  .readdirSync(`${__dirname}/routes`)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })

  .forEach((file) => {
    let path = `./routes/${file.replace('.js', '')}`;
    let customRoutes = require(path);
    customRoutes.stack.forEach((r)=> { allRoutes.push(r); });
    app.use('/api', customRoutes);
  });

//router de teste. retorna as rotas registradas
let rootRoute = express.Router();
rootRoute.get('/', function(req, res){
  res.json(allRoutes);
});

//registro de endpoints
app.use('/', rootRoute);

//404
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
  });
app.set('json spaces', 2);
module.exports = app;
