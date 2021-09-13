import { Router, Request, Response } from 'express';
import {IRequest} from "../../../../../core/routing/core/request";
 import {IResponse} from "../../../../../core/routing/core/response";
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {Company} from "../../../../../core/packages/models/Company.Model";


export const   AdministrationProductivityAPI = ( Api:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    /*region User*/
    interface IUserRequest extends IRequest{
        activities:Company.Activity
    }

    Api.use('/' ,  Routing.registerUtility({
        activities:(req,res)=> new Company.Activity({companyId:req.getUser().assignedCompanyId})
    }));


    Api.get(getUrl('list'),(req:IUserRequest,res:IResponse)=>
        res.promiseAndSend(req.activities.list(req.getDefaultParameter())));

    Api.put(getUrl('updateKey'),(req:IUserRequest,res:IResponse)=>null)
     //   res.promiseAndSend(req.users.updateUserKey(req.getID(), req.getParameter('key'), req.getParameter('value'))));

    Api.put(getUrl('updateProdLevel'),(req:IUserRequest,res:IResponse)=>
        res.promiseAndSend(req.activities.updateProdLevel(req.getID(),  req.getParameter('value'))));


    if(cb)cb(Api);
    return Api;

};

