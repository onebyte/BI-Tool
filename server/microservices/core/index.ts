/***
 * Author Weslley 2021
 * Microservice architecture based on Express(TS)
 */

import * as express from 'express';
import * as http from "http";

const cluster = require('cluster');
const os      = require('os');

import Database  from "./packages/database/Connection";

import {Routing} from "./routing/core/Routing.Core";
import {Nginx} from "./packages/module/server/nginx/http-config";

interface IServerSettings {
    serverId

    enabled

    serviceName

    servicePort

    serviceIP

    clusterNumOfClu

    nginxMaster

    nginxGroupId

    nginxServerName

    nginxLocationPath

}

export class Server {

    /**
     * Configurations Tablename
     * */
    static _tableName         = 'CON_Server';

    /**
     * Configurations entry index key
     * */
    static _configIndexColumn = 'serviceName';

    /**
     * Configurations entry index value
     * */
    static _configIndexValue  = null;

    // Express FrameWork
    private express:express.Application;

    private _http:http.Server

    constructor(private config:IServerSettings, protected db:Database) {

        this.initialise(config);

        this.initialiseRouter(config);

        this.listen({port:config.servicePort});
    }

    /**
     * Initialises the server settings
     * */
    private initialise(config:IServerSettings):void{
        this.express = express();

        if(config.nginxMaster && config.nginxGroupId) {

            const nginx = new Nginx.Server(config.nginxServerName,  config.serviceName );

            /*Gets the Main nginx configuration*/
            this.db.getRows(`select * from ${Server._tableName} where nginxGroupId = ? `,[config.nginxGroupId])
                .then(configs => {

                const getDefaultOptions = ()=> {
                     return  {
                         headers: [
                             {
                                 key:"proxy_set_header" ,
                                 value:"Upgrade $http_upgrade"
                             },
                             {
                                 key:"proxy_set_header" ,
                                 value:'Connection "upgrade"'
                             },
                             {
                                 key:"proxy_set_header" ,
                                 value:'Host "$host"'
                             },
                             {
                                 key:   "proxy_set_header" ,
                                 value: "'Service-Worker-Allowed' '/'"
                             },
                             {
                                 key:   "proxy_set_header" ,
                                 value: "X-Forwarded-For $proxy_add_x_forwarded_for"
                             },
                             {
                                 key:   "proxy_set_header" ,
                                 value: "X-Real-IP $remote_addr"
                             },

                         ]
                     }
                 }

                configs.forEach((config:IServerSettings) => {
                    const defaultOptions = getDefaultOptions();
                    defaultOptions.headers.push({key:   "proxy_pass" , value: "http://0.0.0.0:"+config.servicePort})
                    nginx.createBlock('location', config.nginxLocationPath, defaultOptions);
                })

                nginx.renderAndSave(true);
            });

        }

        // Create Server and pass Config
        this.express.set('ipaddr',  config.serviceIP);
        this.express.set('port',    config.servicePort);
        this._http = http.createServer(this.express);

    }

    /**
     * Initialises Routing
     * */
    private initialiseRouter(config:IServerSettings):void{

        /**
         *  Initialise Express Plugins
         *  Initialise Core Utilites
         *  Initialise Core MiddleWare
         *  Initialise Routes
         * */

       this.onRouterRegisterPlugins(this.express);

       this.onRouterRegisterUtilities(this.express,this.db,process.pid,{socked:null});

       this.onRouterRegisterMiddleWare(this.express);

       this.onRouterRegisterRoutes(this.express);

    }

    protected onRouterRegisterPlugins(express:express.Application){
        new Routing.Plugins(this.express).register()
    };
    protected onRouterRegisterUtilities(express:express.Application,db:Database,pId:number,options:any){
        new Routing.Utilities(express,db,pId,options).register()
    };
    protected onRouterRegisterMiddleWare(express:express.Application){
        new Routing.MiddleWare(express).register();
    };
    protected onRouterRegisterRoutes(express:express.Application){
        new Routing.Routes(express).register();
    };
    protected onReady(){

    }

    /**
     * Start Server
     */
    protected listen(config:{ port?: number, hostname?: string, backlog?: number, listeningListener?: Function }) {
        this._http.listen(config.port, config.hostname, config.backlog, <any>config.listeningListener);
        setTimeout(()=> process.send('ready') ,10);
        this.onReady()
        console.log('listening on port',config.port)
    }

    static getDB():Database{
        return new Database()
    }

}

export class ClusterHandler {

    constructor(private serverClass: typeof Server) {
        this.initErrorHandler();
    }

    private getMasterDB():Database{
        return this.serverClass.getDB();
    }

    private getEnvironment():string{
        return process.env.APP_ENV;
    }

    public getNumberCPUs():number{
        return os.cpus().length;
    }

    public init(){
        const envType = this.getEnvironment();
        if(!envType)return console.error('ERROR: Add environment to .env PATH:' +  __dirname)

        // Initialise Master Database
        const masterDB  = this.getMasterDB();

        const config    = this.getConfig(masterDB);


        // Get ClusterValues And Initialise Servers
        config.then(serverConfig => this.startClusters(<any>{...serverConfig, isMaster: cluster.isMaster,hostName:os.hostname()}, masterDB)) ;
    }


    protected getConfig(db):Promise<IServerSettings>{
        return db.getRow(`select * from ${this.serverClass._tableName} where ${this.serverClass._configIndexColumn} = ?`, [this.serverClass._configIndexValue || db.getDBName()])
    }

    protected initErrorHandler(){
        // Error Handling
        const onError = (error: any, type:string ) => {
            console.log(type,+new Date(),process.env['workerId']);
            console.error((new Date).toUTCString() + ' uncaughtException:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
        process.on('uncaughtException' , (err) =>   onError(err, 'uncaughtException'));
        process.on('unhandledRejection', (err) =>   onError(err, 'unhandledRejection'));
        process.on('exit',               (err)=>  onError(err,'exit'));
    }

    private startClusters(config:IServerSettings,db:Database){
        if(!config ) {
           //console.log(`select * from ${this.serverClass._tableName} where ${this.serverClass._configIndexColumn} = ?`, [this.serverClass._configIndexValue || db.getDBName()])
            return <any>console.error('Cluster Value Invalid', config, `${this.serverClass._configIndexColumn}:${this.serverClass._configIndexValue}`)
        }
        let numOfClu  = config.clusterNumOfClu;
        let numOfCPU  = this.getNumberCPUs();

        if (numOfClu === -1 || numOfClu >= numOfCPU) numOfClu = numOfCPU;
        if (!numOfClu       || numOfClu > 4 ) return <any>console.error('Cluster Value Invalid (clusterNumOfClu)',config,`${this.serverClass._configIndexColumn}:${this.serverClass._configIndexValue}`);

        const forkSlaves = () =>  {
             const randomStartingTs = Math.floor(Math.random() * 4)  + Math.floor(Math.random() * 4)  + Math.floor(Math.random() * 4)  + Math.floor(Math.random() * Math.random())  + (Math.random()*cluster.worker.id);
             setTimeout(()=> new this.serverClass(config,db),randomStartingTs)
        }

        const forkMaster = () => {
            cluster.on('exit', (worker, code, signal) => {
                console.log('worker started', code);
                cluster.fork();
            });
            for (let i = 0; i < numOfClu; i++)  cluster.fork()
        };

        cluster.isMaster ? forkMaster() : forkSlaves();

    }
}


