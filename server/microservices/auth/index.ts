import {env} from "../core/env";
import {Router} from "express";

env.load (require('path').resolve(__dirname,'.','.env'));

import {ClusterHandler, Server} from "../core";
import {Routes} from "./routing/routes/routing";
import {AuthMiddleWare} from "./routing/middleware/middleware";


class AuthApp extends Server{

    static _configIndexValue = 'BI_TOOL_AUTH'

    protected onRouterRegisterMiddleWare(express){
        super.onRouterRegisterMiddleWare(express)
        new AuthMiddleWare(express).register();
    }

    protected onRouterRegisterRoutes(express) {
        express.use(Routes.initialiseRoutes(Router(),''));
        super.onRouterRegisterRoutes(express); // fallback to : 401
    }

}


new ClusterHandler(AuthApp).init()