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

    FinancesReportRevenueAPI.get(getUrl('revenue-chart-bymonth'),(req:IReportRevenueAPIRequest,res:IResponse)=>
        res.promiseAndSend(req.getDB().getRows(`select year,month,A.name,sum(total) as total from FIN_SUM_Revenue
                                                                                                      left join FIN_Account A on
            FIN_SUM_Revenue.accountId = A.accountId
                                                where FIN_SUM_Revenue.companyId = ? and year = YEAR(now()) and
                                                    ( A.code >= ? and A.code<= ?)
                                                group by year,month ,A.name;
        `,[req.getUser().assignedCompanyId,req.getParameter('accountFrom'),
            req.getParameter('accountTill'),])
            .then(rows => {
                const datasetsObj = {};
                const datasets    = [];

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


                rows.forEach(data => {
                    if(!datasetsObj[data.name]) datasetsObj[data.name] =  [0,0,0,0,0,0  ,0,0,0,0,0,0];
                    datasetsObj[data.name][data.month-1] = data.total
                })

                let i = -1;
                for(let name in datasetsObj){
                    datasets.push({
                        label: name.replace('Bruttoerlöse','Btto.'),
                        data:datasetsObj[name],
                        backgroundColor:colorArray[i++]
                    })
                }

                return datasets;
            })));

    FinancesReportRevenueAPI.get(getUrl('revenue-chart-byaccount'),(req:IReportRevenueAPIRequest,res:IResponse)=>
        res.promiseAndSend(req.getDB().getRows(`select A.name,sum(total) as total from FIN_SUM_Revenue
                                                                                                      left join FIN_Account A on
            FIN_SUM_Revenue.accountId = A.accountId
                                                where FIN_SUM_Revenue.companyId = ? and year = YEAR(now()) and
                                                    ( A.code >= ? and A.code<= ?)
                                                group by A.name;  `,[req.getUser().assignedCompanyId,
        req.getParameter('accountFrom'),
        req.getParameter('accountTill'),
        ])
            .then(rows => {

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

              const result = {
                  labels:[],
                  series:[],
                  colors:[]
              }

                rows.map((v,i) => {
                  result.labels.push(v.name.replace('Bruttoerlöse','Btto.'))
                  result.series.push(v.total)
                  result.colors.push(colorArray[i])
                });

                return result
            })));




    if(cb)cb(FinancesReportRevenueAPI);
    return FinancesReportRevenueAPI;

};

