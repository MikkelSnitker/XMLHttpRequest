///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/express/express.d.ts" />
var express = require('express');
var app = express();
app.listen(1337);
function use(path, router) { app.use(path, router); }
exports.use = use;
