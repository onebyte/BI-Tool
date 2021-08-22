import {env} from "../core/env";
env.load( require('path').resolve(__dirname,'.','.env') );

import {Cron} from "../core/packages/module/cron/CronJob.Class";
import {BexioHelper} from "../app1/packages/module/bexio/Bexio.Class";

((currentDate:Date)=>
{
    const instances     = {};
    const cronJob       = new Cron.Job();

    const doBexioSetup  = (id):BexioHelper.Bexio => {
        if(instances[id]) return instances[id];

        let bexio     = new  BexioHelper.Bexio(process.env.BEXIO_TOKEN);
        instances[id] =  bexio.setDBCompanyId(id);

        return bexio;
    }

    cronJob.register(
        'BASE_DATA',                    async (companyId) => {
            const { baseData } = doBexioSetup(companyId);
            return await baseData.importBaseData();
        })

    cronJob.register(
        'TIME_SUM_USERS',               async (companyId) => {
        const {timeTracking} = doBexioSetup(companyId);
        await timeTracking.importTimeTrackingSum();
        return true;
    });

    cronJob.register(
        'REVENUE_BY_ACCOUNT',           async (companyId) => {
        const {reporting} = doBexioSetup(companyId);
        await reporting.importRevenueByAccount(new Date().getFullYear(),new Date().getMonth());
        return true;
    });

    cronJob.register(
        'REVENUE_BY_ACCOUNT_LAST_YEAR', async (companyId) => {
        const {reporting} = doBexioSetup(companyId);
        await reporting.importRevenueByAccount(new Date().getFullYear()-1);
        return true;
    });

    cronJob.register(
        'SUBSCRIPTIONS_ALL',            async (companyId) => {
        const {orders} = doBexioSetup(companyId);
        await orders.getRecurringOrders();
        return true;
    });

    cronJob.do(currentDate);

})(new Date())

