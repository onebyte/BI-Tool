import {Request, Response, NextFunction, Router} from 'express';
import {ResponseUtils} from "./response";
import {IRequest, RequestUtils} from "./request";
import Database from "../../packages/database/Connection";

import CorsMiddleware from "../middleware/cors.middleware";
import MiddlewareBase from "../middleware/base.middleware";

import * as bodyParser      from 'body-parser';
import * as cookieParser    from 'cookie-parser';

export namespace Routing {

    export class Utilities {

        readonly utilities:IRouterUtilities<any>[]  = [
            RequestUtils,
            ResponseUtils
        ];

        constructor( protected express:any, protected db:Database, protected pId:number, protected options:any) {}

        public async register(){

            this.express.use( (req:Request,res,next)=> {
                return new Promise(async resolve => {

                    if(req.method === 'OPTIONS'){
                        return resolve(next())
                    }

                    const inject  = async (utils ) => {

                        //protect default Function
                        req['_get'] = req['_get'] || req.get;

                        // todo: FASTER WAY TO FIND AWAITER
                        const isAwaiter = (func,key)=>func.toString().indexOf('__awaiter')>=0

                        const injector = utils ? utils : this

                        for (let key in   injector) {
                            req[key] = injector[key];


                            // Resolve All Promises
                            const isPromise = isAwaiter(injector[key],key)
                            if(isPromise && key !='injectUtils'){
                                const value = await req[key]()
                                req[key] = () => value
                            }
                        }
                        return req;
                    }

                    await Promise.all(this.utilities.map(fn => {
                        let utils = fn(req, res,next, this.db ,this.pId, this.options);
                        return utils.inject ? utils.inject() : inject(utils);
                    })); // await ?


                    resolve(next());
                }).catch(()=>null)
            })
            return this;
        }
    }

    export class MiddleWare{
        protected readonly middleWares = (req,res,next,routes) : MiddlewareBase[] => [
            new CorsMiddleware(req,res,next,routes),
        ];

        constructor(protected express) {}

        register(){
            this.express.use(async (req,res,next)=>{
                for (let middleWare of this.middleWares(req,res,next,this.express._router.stack)){
                    if(!await middleWare.register()){
                        return res.end(403);
                    }
                }
                next();
            })
        }
    }

    export class Plugins {

        private readonly plugins = () => [
            /**
             * Initialise BodyParser
             * @application/x-www-form-urlencoded | uft 8 ture
             * @application/json
             *
             * */
            bodyParser.urlencoded({extended: true , limit: '150mb', parameterLimit:10000000 }),
            bodyParser.json({limit: '150mb'}),
            /**
             * Initialise cookieParser
             * */
            cookieParser(),
        ]

        constructor(protected express:any){}

        public register(){
            this.plugins().forEach(plugin => this.express.use(plugin));
        }
    }

    export class Routes{

        constructor(private express, params = {}) {}

        register(){
            this.express.use('*', (req, res) => res.sendStatus( 401 ));
        }
    }

    /**
     * Register custom Utility
     * */
    export const registerUtility = (utility):{(req: Request, res: Response, next: any)} => {
        return  (req:Request, res:Response, next) => ({init(){
                for(let func in utility) if (!req[func]) req[func] = utility[func](req,res);
                next();
            }}).init()
    }

    /**
     * Register Protection to path by giving the RoleId
     * callback to middleware:
     * */
    export const registerAccess  = (ids:number[])=>(req:IRequest,res,next)=>{
        return new Promise(resolver =>
            req.emit('auth:hasAccessToApps', {
                resolver:resolver,
                data:ids
            })
        ).then(access => access > 0 ? next() : res.status(401).send())
    }
}

export interface IRouterUtilities<T>{
    (
        req: Request,
        res: Response,
        next: NextFunction,
        db?:Database,
        processId?:number,
        opts?:number,
    ):(T)
}