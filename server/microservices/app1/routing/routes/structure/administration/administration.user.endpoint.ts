import { Router, Request, Response } from 'express';
import {IRequest} from "../../../../../core/routing/core/request";
import {UserHandler} from "../../../../../core/packages/models/User.Model";
import {IResponse} from "../../../../../core/routing/core/response";
import {Routing} from "../../../../../core/routing/core/Routing.Core";


export const   AdministrationUserAPI = ( UserAPI:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    /*region User*/
    interface IUserRequest extends IRequest{
        users:UserHandler
    }

    UserAPI.use('/' ,  Routing.registerUtility({
            users:(req,res)=> new UserHandler()
    }));

    UserAPI.get(getUrl('get'),(req:IUserRequest,res:IResponse)=>
        res.promiseAndSend(req.users.getUserFromCompany(req.getUser().userId,req.getUser().assignedCompanyId)));

    UserAPI.get(getUrl('list'),(req:IUserRequest,res:IResponse)=>
        res.promiseAndSend(req.users.getUsersFromCompany(req.getUser().assignedCompanyId)));

    UserAPI.put(getUrl('updateKey'),(req:IUserRequest,res:IResponse)=>
        res.promiseAndSend(req.users.updateUserKey(req.getID(), req.getParameter('key'), req.getParameter('value'))));


    if(cb)cb(UserAPI);
    return UserAPI;

};

