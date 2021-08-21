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

    API.get(getUrl('users'),(req:IProductivityEmployeesRequest,res:IResponse)=>
     res.promiseAndSend(req.users.getUsersFromCompany(
         req.getUser().assignedCompanyId,req.getParameter('visibility')
     )));


    API.get(getUrl('list-productivity-users-activity'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`
                        select year,month,
                               sum(S.total) as total,
                               sum(if(concat(companyId,'-',activityId) in (
                                   select
                                       concat(companyId,'-',activityId)
                                   from COM_Activities where companyId = 1 and
                                       CONVERT(code,UNSIGNED INTEGER)>0

                               ), total,0)) as totalProd,
                               ifnull(
                                round(100 / (sum(S.total)/sum(if(concat(S.companyId,'-',activityId) in (
                                    select
                                        concat(S.companyId,'-',activityId)
                                    from COM_Activities where S.companyId = ? and
                                        CONVERT(code,UNSIGNED INTEGER)>0
                                ), S.total,0)))),0
                            ) as perc,
                               S.activityId,S.userId, AU.firstName, AU.lastName, AU.profileImage
                        from TIME_SUM_Users S
                                 left join Auth_User AU on (
                            S.userId = AU.userId
                            )
                        where S.companyId = ? and (S.year = YEAR(now()))
                        group by S.year, S.month, S.userId, S.activityId order by S.year, S.month, perc;`,
                [req.getUser().assignedCompanyId,req.getUser().assignedCompanyId])
    ));

    API.get(getUrl('list-revenue'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`
                        select * from FIN_SUM_Revenue
                        where companyId = ? and year = YEAR(now()) and accountId in (
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
                        );`,
                [req.getUser().assignedCompanyId,
                     req.getUser().assignedCompanyId,
                     req.getParameter('labelId')])
    ));

    if(cb)cb(API);
    return API;

};