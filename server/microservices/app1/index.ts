import {env} from "../core/env";
env.load( require('path').resolve(__dirname,'.','.env') );

import {ClusterHandler, Server} from "../core";

import {Router} from "express";
import {Routes} from "./routing/routes/routing";
import {AuthMiddleWare} from "../auth/routing/middleware/middleware";
import {BexioHelper} from "./packages/module/bexio/Bexio.Class";

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

    protected async onReady() {
       let bexioTest = new  BexioHelper.Testing(process.env.BEXIO_TOKEN)


        const test = async ()=> {
            bexioTest.bexio.companyId = 1
            await bexioTest.importBaseData();
            await bexioTest.importTimeTrackingSum();
            await bexioTest.bexio.reporting.importRevenueByAccount(2021)
            bexioTest.bexio.orders.getRecurringOrders();
        }

        //await bexioTest.importBaseData()
        //await bexioTest.bexio.reporting.importRevenueByAccount(2021)
        //await bexioTest.bexio.reporting.importRevenueByAccount(2020)

        var dayInMilliseconds = 1000 * 60 * 60 * 24;
        setInterval(function() {test(); },dayInMilliseconds );
        //test()

        bexioTest.bexio.companyId = 1
        bexioTest.bexio.orders.getRecurringOrders();
    }

}

new ClusterHandler(App).init();


