import { Router } from "express";
import {AuthAPI} from "./structure/auth/auth";

export const Routes = {

    initialiseRoutes (routing:Router,version:string) {
        version      = version ? '/'+version : '';
        const getUrl = (base) => version + '/' + base;

        routing.use(getUrl('auth'),            AuthAPI());

        return routing;
    },
}

