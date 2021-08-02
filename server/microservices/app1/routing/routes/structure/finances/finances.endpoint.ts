import { Router, Request, Response } from 'express';
import {FinancesAccountsAPI} from "./finances.accounts.endpoint";
import {FinancesReportRevenueAPI} from "./report/finances.report.revenue.endpoint";
import {FinancesSubscriptionAPI} from "./finances.subscription.endpoint";
import {Routing} from "../../../../../core/routing/core/Routing.Core";


/**
 * FinancesAPI
 */
export const   FinancesAPI = ( FinancesAPI:Router = Router(), cb = null )=> {

    FinancesAPI.use('/accounts', FinancesAccountsAPI())

    FinancesAPI.use('/report/revenue', FinancesReportRevenueAPI())

    FinancesAPI.use('/subscriptions'  , Routing.registerAccess([5.31]),  FinancesSubscriptionAPI())

    // TODO: WDS
    console.warn('access handling missing in FinancesAPI');

    if(cb)cb(FinancesAPI);

    return FinancesAPI
};


/*
  AdministrationAPI.use('/user/overview',      AdministrationUserOverviewAPI);
  AdministrationAPI.use('/user/role',          AdministrationUserRoleAPI);
  AdministrationAPI.use('/company',            AdministrationCompanyAPI);
  AdministrationAPI.use('/channels/sms',       AdministrationCommunicationSMSAPI);
  AdministrationAPI.use('/channels/email',     AdministrationCommunicationMAILAPI);
  AdministrationAPI.use('/devices/overview',   AdministrationDevicesOverviewAPI);
  AdministrationAPI.use('/task/overview',      AdministrationTaskManagerOverviewAPI);

* */
