import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {IRequest} from "../../../../../core/routing/core/request";
import {IResponse} from "../../../../../core/routing/core/response";
import {Finances} from "../../../../packages/models/finances/Account";
import Account = Finances.Account;


class RevenueChart{

    get
}

export const   DashboardDynamicAPI = ( Main:Router = Router(), cb = null )=> {

    const base:string  = '/';
    const getUrl        = path => base + path;

    interface IDashBoardMainRequest extends IRequest{

    }

    Main.use('/' ,
        Routing.registerUtility({}));

    Main.get(getUrl('accounts/list'),async (req:IDashBoardMainRequest,res:IResponse)=> {
            let accounts:any = req.getParameter('accounts');

            /*
            * allowed accounts for normal users
            * */
        const allowed = [
            3406,3409,
            3402,
            3408,3407,3403
        ]


            if(typeof accounts === 'string'){
                accounts = [accounts]
            }
            if(accounts){
                accounts = accounts.filter(a => !isNaN(a) && allowed.includes(+a)).map(v => +v);
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
                whereYear = `and year in (${years},0)`
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