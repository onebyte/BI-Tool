import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {UserHandler} from "../../../../../core/packages/models/User.Model";
import {Company} from "../../../../../core/packages/models/Company.Model";
import {ManualEntries} from "../../../../packages/models/administration/ManualEntries";

export const   AdministrationManualEntriesAPI = ( API:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IAPIRequest extends IRequest{
        me:ManualEntries
    }

    API.use('/' ,
        Routing.registerUtility({
            me:(req:IRequest,res,next)=>new ManualEntries({
                ... req.getDefaultParameter(),
                companyId:req.getUser().assignedCompanyId,
            })
        }));

    /**
     GroupAPI.get(getUrl('get'),(req:IRoleRequest,res:IResponse)=>
     res.promiseAndSend(req.group.getId());
     * */

    API.get(getUrl('list'),(req:IAPIRequest,res:IResponse)=>
        res.promiseAndSend(req.me.list(req.getDefaultParameter())));

    API.put(getUrl('save'),(req:IAPIRequest,res:IResponse)=>
    res.promiseAndSend(req.me.save()));

    API.patch(getUrl('update'),(req:IAPIRequest,res:IResponse)=>
    res.promiseAndSend(req.me.update()));

    API.delete(getUrl('delete'),(req:IAPIRequest,res:IResponse)=>
    res.promiseAndSend(req.me.delete(req.getID())));


    if(cb)cb(API);
    return API;

};
