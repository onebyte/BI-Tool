/***
 * Author Weslley
 * BI Tool
 * https://github.com/WeslleyDeSouza/BI-Tool 2021
 */

import {Application} from "express";


require('dotenv').config({path:__dirname+'\\..\\.env'})


class Server {

    // Express FrameWork // Application
    app:Application;

    constructor(private config:any = {}) {
        this.initialise();
        this.initialiseRouter();
    }

    /**
     * Initialises the server + Framework<koa>
     * */
    private initialise():void{
        this.initialiseRouter()
    }

    /**
     * Initialises Routing
     * */
    private initialiseRouter():void{

    }

    /**
     * Starts the Server<ip:port>
     * */
    private listen():void{

    }
}

