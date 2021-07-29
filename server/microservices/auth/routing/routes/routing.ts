/**
 * Author: Weslley
 * */

import { Router } from "express";
import {AuthAPI} from "./structure/auth/auth";

export const Routes = {

    initialiseRoutes (routing:Router,version:string) {
        version      = version ? '/'+version : '';
        const getUrl = (base) => version + '/' + base;


        routing.use(getUrl('auth'),            AuthAPI());

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


