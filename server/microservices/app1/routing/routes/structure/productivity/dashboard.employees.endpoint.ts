import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {Company} from "../../../../../core/packages/models/Company.Model";
import {UserHandler} from "../../../../../core/packages/models/User.Model";

export const  ProductivityEmployeesAPI = ( API:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IProductivityEmployeesRequest extends IRequest{
        activity:Company.Activity,
        users:UserHandler,
    }

    API.use('/' , Routing.registerUtility({
            activity:(req,res)=>new Company.Activity({companyId:req.getUser().assignedCompanyId}),
            users:(req,res)=>new UserHandler()
        }));

    API.get(getUrl('activities/list'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(req.activity.list({simple:true})));

    API.get(getUrl('users/list'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(req.users.getUsersFromCompany({companyId:req.getUser().assignedCompanyId})));

    API.get(getUrl('list'),(req:IProductivityEmployeesRequest,res:IResponse)=>
    {

        let searchParams = [req.getUser().assignedCompanyId];
        let where        = 'where companyId = ? '
        let billable     = <any>req.getParameter('billable')

        if(!isNaN(billable)) {
            where += (billable > 0 ? ' and allowable_bill = 1 ' : ' and allowable_bill = 0 ');
        }
        console.log(where, !isNaN(billable), billable)

        return res.promiseAndSend(req.getDB().getRows(`
                select T.companyId,
       T.userId,
       T.year,
       T.month,
       T.activityId,
       TRUNCATE(sum(total), 2) as total,
       TRUNCATE(sum(billable_price), 2) as billable_total,
       TRUNCATE(sum(price)+sum(billable_price), 2) as value
from TIME_SUM_Users T 
                ${where}
                group by T.companyId, T.year, T.month, T.userId, T.activityId
                order by year,month;
            `,searchParams));
    });
    API.get(getUrl('data-range'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRow(`
                select min(year) as minYear,
                       max(year) as maxYear from TIME_SUM_Users
                  where companyId = ?
            `,[req.getUser().assignedCompanyId])
    ));

    API.get(getUrl('chart-productivity-sum'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select year, max(E.total)as target,round(100 / (sum(S.total)/sum(if(concat(S.companyId,'-',activityId) in (
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
                                 where S.companyId = ? and S.year > 2020
                                 group by S.year limit 5;`,[req.getUser().assignedCompanyId,req.getUser().assignedCompanyId])
                .then(rows =>{
                    let data = [];
                    rows.forEach((row) => {data.push( {value:row.perc, target:row.target,  meta:row.year})})
                    return data;
                })
        ));

    API.get(getUrl('chart-users-revenue'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select
                                     T.companyId,
                                     T.userId,
                                     A.firstName as name,
                                     A.color,
                                     T.year,
                                     T.month,
                                     TRUNCATE(sum(price)+sum(billable_price), 2) as total
                                 from TIME_SUM_Users T
                                          left join Auth_User A on (
                                     T.companyId = A.assignedCompanyId and T.userId = A.userId
                                     )
                                 where companyId = ? and year = ?
                                 group by T.companyId, T.year, T.month, T.userId`,[req.getUser().assignedCompanyId,req.getParameter('year') || -1]).then(rows =>{
                var colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
                    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
                    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
                    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
                    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
                    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF']
                const years = {};
                rows.forEach(data => {
                    if(!years[data.year]) years[data.year] =  {};
                    if(!years[data.year][data.userId]) years[data.year][data.userId] =  {
                        label: data.name,
                        data: [0,0,0,0,0,0  ,0,0,0,0,0,0],
                       // borderColor: Utils.CHART_COLORS.red,
                        backgroundColor:data.color || colorArray[Math.floor(Math.random() * colorArray.length-1)  ],
                    };
                    years[data.year][data.userId].data[data.month-1] = data.total
                })

                let dataResult = [];
                let dataYears  = [];
                for(let year in years){
                    dataYears.push(year);
                    dataResult.push(...Object.values(years[year]))
                }

                return {
                    years:dataYears,
                    datasets:dataResult
                }
            })
        ));

    API.get(getUrl('chart-productivity-monthly'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select year,month, sum(total),
                                        round(100 / (sum(total)/sum(if(concat(companyId,'-',activityId) in (
                                            select
                                                concat(companyId,'-',activityId)
                                            from COM_Activities where companyId = ? and
                                                CONVERT(code,UNSIGNED INTEGER)>0

                                        ), total,0)))) as perc
                                 from TIME_SUM_Users
                                 where companyId = ? and year = ?
                                 group by year,month`,[req.getUser().assignedCompanyId,req.getUser().assignedCompanyId,req.getParameter('year') || -1])
                .then(async rows =>{
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
                        target:await req.getDB().getValue(`select  total from FIN_LIST_ManualEntries where companyId = ? and entryType = 'targets' and entrySource = 'productivity' and YEAR(date) = ? order by date desc `,[
                            req.getUser().assignedCompanyId,req.getParameter('year') || -1
                        ],'total',0),
                        years: dataYears,
                        series:dataResult
                    }
                })
        ));

    API.get(getUrl('chart-bubble'),(req:IProductivityEmployeesRequest,res:IResponse)=>{
      res.promiseAndSend(req.getDB().getRows(`
            select                   T.companyId,
                                     T.userId,
                                     A.firstName as name,
                                     A.profileImage,
                                     A.color,
                                     T.year,
                                     T.month,
                                     TRUNCATE(sum(price), 2) as total,
                                     TRUNCATE(sum(billable_price), 2) as billable_total
                                 from TIME_SUM_Users T
                                          left join Auth_User A on (
                                     T.companyId = A.assignedCompanyId and T.userId = A.userId
                                     )
                                 where companyId = ? and year = ? and month = ?
                                 group by T.companyId, T.year, T.month, T.userId
        `,[req.getUser().assignedCompanyId,req.getParameter('year') || -1,req.getParameter('month') || -1]))
    });

    API.get(getUrl('chart-productivity-billable'),(req:IProductivityEmployeesRequest,res:IResponse)=>
        res.promiseAndSend(
            req.getDB().getRows(`select year,month, sum(billable_price) as total from TIME_SUM_Users T
                                 where T.companyId = ?  and allowable_bill = 1 and year = ?
                                 group by year,month;`,
                [req.getUser().assignedCompanyId,req.getParameter('year') || new Date().getFullYear()])
                .then(rows => {
                    return {
                        rows:rows,
                        labels:[],
                        series:rows.map(v=>v.total),
                    }
                })
        ));

    if(cb)cb(API);
    return API;

};