import {env} from "../core/env";
env.load( require('path').resolve(__dirname,'.','.env') );

import {ClusterHandler, Server} from "../core";

import {Router} from "express";
import {Routes} from "./routing/routes/routing";
import {AuthMiddleWare} from "../auth/routing/middleware/middleware";

class App extends Server {

    protected onRouterRegisterRoutes(express) {
        express.use(Routes.initialiseRoutes(Router(),'v1'));
        super.onRouterRegisterRoutes(express); // fallback to : 401
    }

    /**
     * TODO:WDS Find a better solution
     * */
    protected onRouterRegisterMiddleWare(express){
        super.onRouterRegisterMiddleWare(express)
        new AuthMiddleWare(express).register();
    }
}

new ClusterHandler(App).init();


