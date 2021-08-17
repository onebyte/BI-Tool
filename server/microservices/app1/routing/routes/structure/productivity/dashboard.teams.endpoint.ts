import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {Company} from "../../../../../core/packages/models/Company.Model";
import {UserHandler} from "../../../../../core/packages/models/User.Model";

export const  ProductivityTeamsAPI = ( API:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IProductivityEmployeesRequest extends IRequest{
        activity:Company.Activity,
        groups:Company.Group,
        users:UserHandler,
    }

    API.use('/' , Routing.registerUtility({
            groups:(req,res)=>   new Company.Group({companyId:req.getUser().assignedCompanyId}),
            activity:(req,res)=> new Company.Activity({companyId:req.getUser().assignedCompanyId}),
            users:(req,res)=>    new UserHandler()
    }));

    API.get(getUrl('list'),(req:IProductivityEmployeesRequest,res:IResponse)=>
     res.promiseAndSend(req.groups.all('G:TEAM')));

    if(cb)cb(API);
    return API;

};