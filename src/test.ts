///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/express/express.d.ts" />
import * as express from 'express';


var app = express();
app.listen(1337);
  


export function use(path:string, router: express.Router){ app.use(path, router); }
