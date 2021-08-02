import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {ProductivityEmployeesAPI} from "./dashboard.employees.endpoint";


/**
 * ProductivityAPI 
 */
export const  ProductivityAPI = ( ProductivityAPI:Router = Router(), cb = null )=> {

    ProductivityAPI.use('/employees',Routing.registerAccess([12.01]),   ProductivityEmployeesAPI());

    if(cb)cb(ProductivityAPI);

    return ProductivityAPI
};
