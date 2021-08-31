import { Router, Request, Response } from 'express';
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";


export const   AdministrationCronTaskAPI = ( API:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    /*region User*/
    interface ICronTaskRequest extends IRequest{

    }

    API.get(getUrl('list'),(req:ICronTaskRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`
            select * from COM_Tasks where companyId = ?`,[
                req.getUser().assignedCompanyId
    ])));

    if(cb)cb(API);
    return API;

};

