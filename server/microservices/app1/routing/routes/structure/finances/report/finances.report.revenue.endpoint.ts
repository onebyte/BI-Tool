import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../../core/routing/core/request";
import {IResponse} from "../../../../../../core/routing/core/response";
import {Finances} from "../../../../../packages/models/finances/Account";
import Account = Finances.Account;

export const   FinancesReportRevenueAPI = ( FinancesReportRevenueAPI:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    /*region User*/
    interface IReportRevenueAPIRequest extends IRequest{
        accounts:Account
    }

    FinancesReportRevenueAPI.use('/' ,  Routing.registerUtility({
            accounts: (req , res) => new Account({companyId:1})
        }));

    FinancesReportRevenueAPI.get(getUrl('accounts/list'),(req:IReportRevenueAPIRequest,res:IResponse)=>
        res.promiseAndSend(req.accounts.all()));


    FinancesReportRevenueAPI.get(getUrl('list'),(req:IReportRevenueAPIRequest,res:IResponse)=>
        res.promiseAndSend(req.getDB().getRows(`select
                                                    A.code,
                                                    A.name,
                                                    R.accountId,
                                                    R.year,
                                                    R.month,
                                                    sum(R.total) as total
                                                from FIN_SUM_Revenue R
                                                         left join FIN_Account A on (
                                                        (A.companyId =  R.companyId or A.companyId is null)  and A.accountId = R.accountId
                                                    )
                                                group by R.year, R.month,R.accountId, A.name, A.code
                                                order by A.code;
        `)));



    if(cb)cb(FinancesReportRevenueAPI);
    return FinancesReportRevenueAPI;

};

