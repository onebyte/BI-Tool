import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {Company} from "../../../../../core/packages/models/Company.Model";
import {UserHandler} from "../../../../../core/packages/models/User.Model";
import {Statistics} from "../../../../packages/models/Statisitcs.Class";

export const  ProductivityTeamsAPI = ( API:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl       = path => base + path;

    interface IProductivityEmployeesRequest extends IRequest{
        activity:Company.Activity,
        groups:Company.Group,
        users:UserHandler,
        statisticsProd:Statistics.Productivity
    }

    API.use('/' , Routing.registerUtility({
            groups:(req,res)=>   new Company.Group({companyId:req.getUser().assignedCompanyId}),
            activity:(req,res)=> new Company.Activity({companyId:req.getUser().assignedCompanyId}),
            users:(req,res)=>    new UserHandler(),
            statisticsProd:(req,res)=>new Statistics.Productivity(req.getUser().assignedCompanyId)


    }));

    API.get(getUrl('list'),(req:IProductivityEmployeesRequest,res:IResponse)=>
     res.promiseAndSend(req.groups.all('G:TEAM')));

    API.get(getUrl('users'),(req:IProductivityEmployeesRequest,res:IResponse)=>
     res.promiseAndSend(req.users.getUsersFromCompany(
         req.getUser().assignedCompanyId,req.getParameter('visibility')
     )));


    API.get(getUrl('list-productivity-users-activity'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.statisticsProd.getProductivityByUsers(
                req.getParameter('from'),
                req.getParameter('till')
            )
        )
    );

    API.get(getUrl('list-revenue'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`
                        select * from FIN_SUM_Revenue
                        where companyId = ? and 
                              (
                                  (
                                          (FIN_SUM_Revenue.year >= YEAR(?) and FIN_SUM_Revenue.month >= Month(?)) and
                                          (FIN_SUM_Revenue.year <= YEAR(?) and FIN_SUM_Revenue.month <= Month(?))
                                  )
                               )
                              
                              and accountId in (
                            select accountId from  FIN_Account
                                                       inner join (
                                select group_concat( distinct accountId) as accounts from COM_GroupLink
                                                                                              left join COM_Activities CA
                                                                                                        on COM_GroupLink.companyId = CA.companyId and
                                                                                                           COM_GroupLink.linkId = CA.activityId
                                where COM_GroupLink.companyId = ?
                                  and source = 'activities' and type = 'G:TEAM' and labelId = ?
                                group by labelId 
                            )  bind  ON FIND_IN_SET(accountId, bind.accounts)
                        );`, [req.getUser().assignedCompanyId,
                     req.getParameter('from'),req.getParameter('from'),
                     req.getParameter('till'),req.getParameter('till'),
                     req.getUser().assignedCompanyId,
                     req.getParameter('labelId')]))
    );

    if(cb)cb(API);
    return API;

};