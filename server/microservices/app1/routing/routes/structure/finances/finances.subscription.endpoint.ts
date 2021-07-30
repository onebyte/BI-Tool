import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {Finances} from "../../../../packages/models/finances/Account";
import Account = Finances.Account;

export const   FinancesSubscriptionAPI = ( API:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    /*region User*/
    interface IFinSubscriptionAPIRequest extends IRequest{

    }

    API.use('/' ,  Routing.registerUtility({

    }));

    API.get(getUrl('list'),(req:IFinSubscriptionAPIRequest,res:IResponse)=>
    {

        const params = req.getDefaultParameter();
        let   where  = 'and ';
        let   values = []

        if(params.subscriptionType){
            where += '  ( subscriptionType = ? ) and ';
            values.push(`${params.subscriptionType}`)
        }
        if(params.start){
            where += ' start >= ?  and ';
            values.push(params.start)
        }
        if(params.end){
            where += ' start <= ? and () and';
            values.push(params.end)
        }
        if(params.search){
            where += ' (subscriptionId like ? or title like ? or subscriptionType like ? ) and ';
            values.push(`${params.search}%`)
            values.push(`${params.search}%`)
            values.push(`${params.search}%`)
        }

        if(where === 'and ') where = '';
        else where = where.substring(0, where.length-4)

        res.promiseAndSend(req.getDB().getRows(`select * from FIN_LIST_Subscriptions where companyId = 1 ${where} order by subscriptionId desc`,[
            ...values
        ]))

    });

    API.get(getUrl('chart-subscriptions-monthly-revenue'),(req:IFinSubscriptionAPIRequest,res:IResponse)=>
        res.promiseAndSend(req.getDB().getRows(`
            SELECT @row := @row + 1 AS monthIndex
                 ,(
                select sum(total_monthly) from FIN_LIST_Subscriptions
                where companyId = ? and
                    (start is null or (start <= DATE(concat(YEAR(now()),'-'  ,@row ,'-01'))) )
                  and (end   is null or (DATE(concat(YEAR(now()),'-'  ,@row ,'-01')) <= end))
            ) as total
            FROM (
                  (select 0 union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9 union all  select 10 union all  select 11) t,
                  (SELECT @row:=0) numbers)
    `,[
        req.getUser().assignedCompanyId,
        ]).then(rows =>{
            return {
                series:rows.map(v => v.total)
            }
        })));

    API.get(getUrl('chart-subscriptions-monthly'),(req:IFinSubscriptionAPIRequest,res:IResponse)=>
        res.promiseAndSend(req.getDB().getRows(`
            select YEAR(start) as year,
                   Month(start) as month,
                   count(*) as total,
                   (select max(R.total) from FIN_LIST_ManualEntries R where
                       R.companyId = S.companyId and year(R.date) = YEAR(S.start)  and R.entryType = 'targets' and R.entrySource = 'subscriptions' limit 1) as target
            from FIN_LIST_Subscriptions S
            where S.companyId = 1 and  S.subscriptionType not like '%Domain%' and title  not like '%Domain%'
            group by YEAR(S.start),Month(S.start), target
    `, [
        req.getUser().assignedCompanyId,
        req.getUser().assignedCompanyId,
        ])
            .then(rows =>{

            let current = rows.find( row => row.year == new Date().getFullYear());

            const years = {};
            rows.forEach(data => {
                if(!years[data.year]) years[data.year] =  [0,0,0,0,0,0  ,0,0,0,0,0,0];
                years[data.year][data.month-1] = data.total
            })

            let dataResult = [];
            let dataYears  = [];
            for(let year in years){
                dataYears.push(year);
                dataResult.push(Object.values(years[year]))
            }

            return {
                target:current?current.target:null,
                years: dataYears,
                series:dataResult
            }
        })));

    API.get(getUrl('chart-subscriptions-sum'),(req:IFinSubscriptionAPIRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select year(start) as year,
                                        count(*) as value,
                                        (select max(R.total) from FIN_LIST_ManualEntries R where
                                            R.companyId = FIN_LIST_Subscriptions.companyId and year(R.date) = YEAR(start)
                                        and R.entryType = 'targets' and R.entrySource = 'subscriptions' limit 1) as target
                                 from FIN_LIST_Subscriptions
                                 where companyId = 1 and subscriptionType not like '%Domain%' 
                                 group by year,target limit 5;`,
                [req.getUser().assignedCompanyId,req.getUser().assignedCompanyId])
        ));
    API.get(getUrl('chart-subscriptions-grouped'),(req:IFinSubscriptionAPIRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`SELECT
                                     subscriptionType as title,
                                     count(*) as total  FROM FIN_LIST_Subscriptions
                                 where companyId = ? and year(start) = year(now()) and subscriptionType not like '%Domain%'
                                 group by  year(start),  subscriptionType`,
                [req.getUser().assignedCompanyId])
                .then(rows => {
                    return {
                        rows:rows,
                        labels:rows.map(v=>v.title),
                        series:rows.map(v=>v.total),
                    }
                })
        ));

    if(cb)cb(API);
    return API;

};

