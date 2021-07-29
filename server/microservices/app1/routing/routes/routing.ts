/**
 * Author: Weslley
 * */

import { Router } from "express";
import AppsAPI from "./apps/AppsEndPoint";
import {AdministrationAPI} from "./structure/administration/administration.endpoint";
import {FinancesAPI} from "./structure/finances/finacnes.endpoint";
import {DashboardAPI} from "./structure/dashboard/dashboard.endpoint";
import {ProductivityAPI} from "./structure/productivity/productivity.endpoint";
import {Routing} from "../../../core/routing/core/Routing.Core";

export const Routes = {

    initialiseRoutes (routing:Router,version:string) {
        version      = '/'+version;
        const getUrl = (base) => version + '/' + base;

        routing.use(getUrl('apps'),             AppsAPI());

        routing.use(getUrl('administration'),   AdministrationAPI());

        routing.use(getUrl('finances'),         FinancesAPI());

        routing.use(getUrl('dashboard'),        DashboardAPI());

        routing.use(getUrl('productivity'),     ProductivityAPI());

       // RountingDoc.init(routing);


        return routing;
    },

}

export const RountingDoc = {

    init(router:Router){
        // https://editor.swagger.io/#
        const swaggerOptions = {
            basePath: '/',
            swaggerDefinition: {
                info: {
                    version: "2.0.0",
                    title: "MovIT BE API",
                    description: "Official MOV API",
                }
            },
            apis: [
              //  "./app.routing.js",
                "./**/*.js",
                "./**/**/*.js",
                "./**/**/**/*.js",
            ]
        };
        const swaggerJsDoc   = require("swagger-jsdoc");
        const swaggerUi      = require("swagger-ui-express");
        const swaggerDocs = swaggerJsDoc(swaggerOptions);

        router.use("/movapi-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

        this.example(router)

        console.log('Docs are online:','/movapi-docs')

    },

    example(express){
        express.use('/sayHi',()=>{console.warn('sayHi')})
    }
}

