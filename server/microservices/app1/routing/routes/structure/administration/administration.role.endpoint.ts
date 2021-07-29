import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {UserHandler} from "../../../../../core/packages/models/User.Model";
import {AppsHandler} from "../../../../../core/packages/classes/Apps.Class";


export const   AdministrationRoleAPI = ( RoleAPI:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IRoleRequest extends IRequest{
        role:AppsHandler,
        users:UserHandler,
    }

    RoleAPI.use('/' ,
        Routing.registerUtility({
            role:(req,res)=> new AppsHandler(),
            users:(req,res)=> new UserHandler(),
        }));

    RoleAPI.get(getUrl('get'),(req:IRoleRequest,res:IResponse)=>
        res.promiseAndSend(req.role.getRoleFromCompany(req.getID(),req.getUser().assignedCompanyId)));

    RoleAPI.get(getUrl('list'),(req:IRoleRequest,res:IResponse)=>
        res.promiseAndSend(req.role.getRolesFromCompany(req.getUser().assignedCompanyId)));

    RoleAPI.delete(getUrl('delete'),(req:IRoleRequest,res:IResponse)=>
        res.promiseAndSend(req.role.deleteRole(req.getID(),req.getUser().assignedCompanyId)));

    RoleAPI.put(getUrl('save'),(req:IRoleRequest,res:IResponse)=>
        res.promiseAndSend(req.role.addRole({
            ...req.getDefaultParameter(),
            companyId:req.getUser().assignedCompanyId
        })));


    RoleAPI.get(getUrl('users/list'),(req:IRoleRequest,res:IResponse)=>
     res.promiseAndSend(req.users.getUsersFromCompany(req.getUser().assignedCompanyId)));

    RoleAPI.get(getUrl('apps/list'),(req:IRoleRequest,res:IResponse)=>
     res.promiseAndSend(req.role.getAllApps(req.getUser().assignedCompanyId)));


    if(cb)cb(RoleAPI);
    return RoleAPI;

};