import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";

export const   DashboardMainAPI = ( Main:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IDashBoardMainRequest extends IRequest {}

    Main.use('/' ,
        Routing.registerUtility({}));

    Main.get(getUrl('chart-revenue-sum'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select
                                     R.year,
                                     sum(R.total) as total,
                                     max(E.total) as target
                                 from FIN_SUM_Revenue R
                                          left join FIN_LIST_ManualEntries E on (
                                         R.companyId = E.companyId and
                                         E.entrySource = 'sales' and
                                         R.year = year(E.date)
                                     )
                                 where R.companyId = ? and R.year>2019

                                 group by R.companyId , R.year limit 5;`,[req.getUser().assignedCompanyId])
                .then(rows =>{
                 let data = [];
                 rows.forEach((row) => {data.push( {value:row.total, target:row.target,  meta:row.year})})
                 return data;
            })
        ));


    Main.get(getUrl('chart-revenue'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select companyId,year, month, TRUNCATE(sum(total), 2) as total from FIN_SUM_Revenue
where companyId = ? and year > 2019
group by companyId,year, month order by year,month;`,[req.getUser().assignedCompanyId]).then(rows =>{
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
                    years:dataYears,
                    series:dataResult
                }
            })
    ));

    Main.get(getUrl('chart-revenue-quartal'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`

                select R.year,
                       QUARTER(Date(concat(R.year,'-',R.month,'-',01))) as Q,
                       if(FA.code in (3403, 3408, 3407),1,  if(FA.code in (3406, 3409),2,3)) as type,
                       TRUNCATE(sum(R.total), 2) as total from FIN_SUM_Revenue R
                                                                   left join FIN_Account FA on (
                    R.companyId = FA.companyId and R.accountId = FA.accountId
                    )
                where R.companyId = ? and R.year = ? and FA.code in(
                                                                       3403, 3408, 3407, # Technik
                                                                       3406, 3409, # marketing
                                                                       3402 # creation
                    )
                group by R.year , QUARTER(Date(concat(R.year,'-',R.month,'-',01))), if(FA.code in (3403, 3408, 3407),1,  if(FA.code in (3406, 3409),2,3))
                order by R.year;`,[req.getUser().assignedCompanyId,new Date().getFullYear()]).then(rows =>{

                const labels = ['Technik','Marketing','Kreation']
                const createObj = (obj,i) => {return {meta: labels[i], value: 0}}
                const year = {
                    1:[0,0,0].map(createObj),
                    2:[0,0,0].map(createObj),
                    3:[0,0,0].map(createObj),
                    4:[0,0,0].map(createObj),
                }
                rows.forEach(row => year[row.Q][row.type-1].value = row.total)


                const getByType = num => [year["1"][num],year["2"][num],year["3"][num],year["4"][num]]

                return {
                    year : new Date().getFullYear(),
                    series:[

                            getByType(0),
                            getByType(1),
                            getByType(2)

                    ]
                }
            })
        ));

    /**
     * Get sum of productivity in % by month
     * productivity = WorkingHours / chargeable hours
     * onebyte (2020>)
     * */
    Main.get(getUrl('chart-productivity'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`
                select year,month, sum(total),
                       round(100 / (sum(total)/sum(if(concat(companyId,'-',activityId) in (
                           select
                               concat(companyId,'-',activityId)
                           from COM_Activities where companyId = ? and
                               CONVERT(code,UNSIGNED INTEGER)>0

                       ), total,0)))) as perc
                from TIME_SUM_Users
                where companyId = ? and (year > 2020 or (year = 2020 and month >= 11) ) 
                group by year,month;
`,[req.getUser().assignedCompanyId,req.getUser().assignedCompanyId]).then(rows =>{
                const years = {};

                rows.forEach(data => {
                    if(!years[data.year]) years[data.year] =  [0,0,0,0,0,0  ,0,0,0,0,0,0];
                    years[data.year][data.month-1] = data.perc
                })

                let dataResult = [];
                let dataYears  = [];
                for(let year in years){
                    dataYears.push(year);
                    dataResult.push(Object.values(years[year]))
                }

                return {
                    years:dataYears,
                    series:dataResult
                }
            })
        ));

    Main.get(getUrl('chart-productivity-sum'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select year,
                                        (
                                            select total from FIN_LIST_ManualEntries M
                                            where E.companyId = M.companyId and
                                                M.entrySource = 'productivity' and
                                                S.year = year(M.date) order by M.date desc
                                            limit 1

                                        )  as target,
       round(100 / (sum(S.total)/sum(if(concat(S.companyId,'-',activityId) in (
                select
                    concat(S.companyId,'-',activityId)
                from COM_Activities where S.companyId = ? and
                    CONVERT(code,UNSIGNED INTEGER)>0
            ), S.total,0)))) as perc
                                 from TIME_SUM_Users S
                                          left join FIN_LIST_ManualEntries E on (
                                         E.companyId = S.companyId and
                                         E.entrySource = 'productivity' and
                                         S.year = year(E.date)
                                     )
                                 where S.companyId = ? and (S.year > 2020 or (year = 2020 and month = 12) )
                                 group by S.year limit 5;`,[req.getUser().assignedCompanyId,req.getUser().assignedCompanyId])
                .then(rows =>{
                    let data = [];
                    rows.forEach((row) => {data.push( {value:row.perc, target:row.target,  meta:row.year})})
                    return data;
                })
        ));
    Main.get(getUrl('chart-employee-sum'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select 
                                        YEAR(T.date) as year,
                                        avg(T.total) as value,
                                        (select max(R.total) from FIN_LIST_ManualEntries R where
                                            R.companyId = ? and year(R.date) = YEAR(T.date)
                                            and R.entryType = 'targets' and R.entrySource = 'employee' limit 1) as target
                                 from FIN_LIST_ManualEntries T

                                 where T.companyId = ?  and T.entryType = 'results' and T.entrySource = 'employee'
                                 group by T.companyId, year(T.date),target limit 5;`,
                [req.getUser().assignedCompanyId,req.getUser().assignedCompanyId])
        ));
    Main.get(getUrl('chart-customer-sum'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select 
                                        YEAR(T.date) as year,
                                        avg(T.total) as value,
                                        (select max(R.total) from FIN_LIST_ManualEntries R where
                                            R.companyId = ? and year(R.date) = YEAR(T.date)
                                            and R.entryType = 'targets' and R.entrySource = 'customer' limit 1) as target
                                 from FIN_LIST_ManualEntries T

                                 where T.companyId = ?  and T.entryType = 'results' and T.entrySource = 'customer'
                                 group by T.companyId, year(T.date),target limit 5;`,
                [req.getUser().assignedCompanyId,req.getUser().assignedCompanyId])
        ));


    Main.get(getUrl('chart-subscription-sum'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select year(start) as year,
                                        count(*) as value,
                                        (select max(R.total) from FIN_LIST_ManualEntries R where
                                            R.companyId = 1 and year(R.date) = YEAR(start)
                                        and R.entryType = 'targets' and R.entrySource = 'subscriptions' limit 1) as target
                                 from FIN_LIST_Subscriptions
                                 where subscriptionType not like '%Domain%' and title  not like '%Domain%'
                                 group by year,target limit 5;`,
                [req.getUser().assignedCompanyId,req.getUser().assignedCompanyId])
    ));

    Main.get(getUrl('chart-subscriptions-grouped'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`SELECT
                                     subscriptionType as title,
                                     count(*) as total  FROM FIN_LIST_Subscriptions
                                 where companyId = ? and year(start) = ? and subscriptionType not like '%Domain%'
                                 group by  year(start),  subscriptionType`,
                [req.getUser().assignedCompanyId,req.getParameter('year') || new Date().getFullYear()])
                .then(rows => {
                    return {
                        rows:rows,
                        labels:rows.map(v=>v.title),
                        series:rows.map(v=>v.total),
                    }
                })
    ));


    /**
     * Get sum of manual entriey in % by month
     * productivity = WorkingHours / chargeable hours
     * */
    Main.get(getUrl('chart-manual-entry'),(req:IDashBoardMainRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`
                select  YEAR(date) as year, 
                       TRUNCATE(avg(total), 2) as total from FIN_LIST_ManualEntries
                where companyId = ? and entryType = 'results'
                  and entrySource = ?
                group by companyId, YEAR(date) order by YEAR(date);
`,[req.getUser().assignedCompanyId,req.getParameter('entrySource') || '-1']).then(rows =>{
                const years = {};

                rows.forEach(data => {
                    if(!years[data.year]) years[data.year] =  [0];
                    years[data.year][0] = data.total
                })

                let dataResult = [];
                let dataYears  = [];
                for(let year in years){
                    dataYears.push(year);
                    dataResult.push(Object.values(years[year]))
                }

                return {
                    years:dataYears,
                    series:dataResult
                }
            })
        ));

    if(cb)cb(Main);
    return Main;

};



