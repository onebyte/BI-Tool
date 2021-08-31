import { Router, Request, Response } from 'express';
import {Routing} from "../../../../../core/routing/core/Routing.Core";

import {AdministrationUserAPI} from "./administration.user.endpoint";
import {AdministrationRoleAPI} from "./administration.role.endpoint";
import {AdministrationGroupAPI} from "./administration.group.endpoint";
import {AdministrationManualEntriesAPI} from "./administration.manual-entries.endpoint";
import {AdministrationCronTaskAPI} from "./administration.cron-task.endpoint";

/**
 * AdministrationAPI
 */
export const  AdministrationAPI = ( AdministrationAPI:Router = Router(), cb = null )=> {

    AdministrationAPI.use('/user',Routing.registerAccess([3.01]),   AdministrationUserAPI())

    AdministrationAPI.use('/role',Routing.registerAccess([3.02]),   AdministrationRoleAPI())

    AdministrationAPI.use('/group',Routing.registerAccess([3.03]),  AdministrationGroupAPI())

    AdministrationAPI.use('/manual-entries',Routing.registerAccess([3.11]),  AdministrationManualEntriesAPI())

    AdministrationAPI.use('/cron-task',Routing.registerAccess([3.12]),  AdministrationCronTaskAPI())


    if(cb)cb(AdministrationAPI);

    return AdministrationAPI
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
