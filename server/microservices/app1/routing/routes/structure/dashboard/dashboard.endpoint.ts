import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {DashboardMainAPI} from "./dashboard.main.endpoint";
import {DashboardDynamicAPI} from "./dashboard.dynamic.endpoint";
import {DashboardDynamicSelfAPI} from "./dashboard.dynamic-self.endpoint";


/**
 * AdministrationAPI
 */
export const  DashboardAPI = ( DashboardAPI:Router = Router(), cb = null )=> {

    DashboardAPI.use('/main',Routing.registerAccess([1.01]),   DashboardMainAPI())

    DashboardAPI.use('/dynamic',Routing.registerAccess([1.01]),   DashboardDynamicAPI())

    DashboardAPI.use('/dynamic-self',Routing.registerAccess([1.11]),   DashboardDynamicSelfAPI())


    if(cb)cb(DashboardAPI);

    return DashboardAPI
};
