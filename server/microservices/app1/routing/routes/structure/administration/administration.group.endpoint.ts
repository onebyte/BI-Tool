import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {UserHandler} from "../../../../../core/packages/models/User.Model";
import {Company} from "../../../../../core/packages/models/Company.Model";

export const   AdministrationGroupAPI = ( GroupAPI:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IGroupRequest extends IRequest{
        group:Company.Group,
        users:UserHandler,
    }

    GroupAPI.use('/' ,
        Routing.registerUtility({
            group: (req,res) => new Company.Group({companyId:req.getUser().assignedCompanyId}),
            users: (req,res) => new UserHandler(),
        }));

    /**
     GroupAPI.get(getUrl('get'),(req:IRoleRequest,res:IResponse)=>
     res.promiseAndSend(req.group.getId());
     * */

    GroupAPI.get(getUrl('list'),(req:IGroupRequest,res:IResponse)=>
        res.promiseAndSend(req.group.all('G:TEAM')));

    GroupAPI.put(getUrl('save'),(req:IGroupRequest,res:IResponse)=>
        res.promiseAndSend(req.group.create('G:TEAM',
            req.getParameter('title'),
            req.getParameter('color'),
            req.getParameter('labelId'),
            req.getParameter('users'),
        ))
    );
    GroupAPI.delete(getUrl('delete'),(req:IGroupRequest,res:IResponse)=>
        res.promiseAndSend(req.group.deleteByLabelId(req.getID())));


    GroupAPI.get(getUrl('users/list'),(req:IGroupRequest,res:IResponse)=>
     res.promiseAndSend(req.users.getUsersFromCompany(req.getUser().assignedCompanyId)));


    if(cb)cb(GroupAPI);
    return GroupAPI;

};
