import { Router, Request, Response } from 'express';
import {IRequest} from "../../../../../core/routing/core/request";
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IResponse} from "../../../../../core/routing/core/response";

import {Finances} from "../../../../packages/models/finances/Account";
import Account = Finances.Account;


export const   FinancesAccountsAPI = ( FinancesAccountsAPI:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    /*region User*/
    interface IAccountsRequest extends IRequest{
        accounts:Account
    }

    FinancesAccountsAPI.use('/' ,  Routing.registerUtility({
            accounts: (req , res) => new Account({companyId:1})
        }));

    FinancesAccountsAPI.get(getUrl('get'),(req:IAccountsRequest,res:IResponse)=>
        res.promiseAndSend(req.accounts.find(req.getUser().userId,req.getUser().assignedCompanyId)));

    FinancesAccountsAPI.get(getUrl('list'),(req:IAccountsRequest,res:IResponse)=>
        res.promiseAndSend(req.accounts.all()));



    if(cb)cb(FinancesAccountsAPI);
    return FinancesAccountsAPI;

};

