import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {Finances} from "../../../../packages/models/finances/Account";
import Account = Finances.Account;



export const   DashboardDynamicSelfAPI = ( Main:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IDashBoardMainRequest extends IRequest{

    }

    Main.use('/' ,
        Routing.registerUtility({}));

    Main.get(getUrl('appSettings'),(req:IDashBoardMainRequest,res:IResponse) =>
        res.promiseAndSend(
            req.getUser().getAppSettings(
                req.getParameter('appId')
            )
        )
    );

    Main.put(getUrl('saveAppSettings'),(req:IDashBoardMainRequest,res:IResponse) =>
        res.promiseAndSend(
            req.getUser().setAppSettings(
                1.11,
                req.getParameter('settings'),
            )
        )
    );

    Main.get(getUrl('accounts/list'),async (req:IDashBoardMainRequest,res:IResponse)=> {
            let accounts:any = req.getParameter('accounts');

            /*
            * allowed accounts for normal users
            * */

            let {access} = req.getUser().appAccess.find(app => app.appId == 1.11) || {}
            if(access !== 'root'){
                return res.sendAnswer(res,<any>{},401,{
                    message:'rootAccessNeeded',notify:true
                })
            }

            if(!accounts)accounts=[]

            if(typeof accounts === 'string'){
                accounts = [accounts]
            }
            if(accounts){
                accounts = accounts.filter(a => !isNaN(a) ).map(v => +v);
                for(let i = 0; i<accounts.length;i++){
                   const account = await Account.getAccountByCode(accounts[i],req.getUser().assignedCompanyId)
                    accounts[i] = account ? account.accountId: -0;
                }
                accounts = accounts.join(',')
            }


            let whereYear = '';
            let years:any = req.getParameter('years');
            if(typeof years === 'string'){
                years = [years]
            }
            if(years){
                years = years.filter(a => !isNaN(a)).map(v => +v).join(',')
                whereYear = `and year in (${years || -1},0)`
            }

            res.promiseAndSend(
                req.getDB().getRows(`
                select companyId,year, month, TRUNCATE(sum(total), 2) as total from FIN_SUM_Revenue
                where accountId in (${accounts},0) ${whereYear}
                group by companyId,year, month
                order by year,month;`)
                    .then(rows =>{
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
                            years:   dataYears,
                            series:  dataResult,
                            accounts:(accounts || '').split(',')
                        }
                    }));
        });


    if(cb)cb(Main);
    return Main;

};