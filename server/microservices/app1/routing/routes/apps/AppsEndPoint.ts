/**
 * Created by weDeS on 26.01.2020.
 */
import { Router, Request, Response } from 'express';
import {IRequest} from "../../../../core/routing/core/request";
import {AppsHandler} from "../../../../core/packages/classes/Apps.Class";
import {Routing} from "../../../../core/routing/core/Routing.Core";
import {IResponse} from "../../../../core/routing/core/response";

/**
 * Handles Apps API
 */
export const  AppsAPI = ( AppsAPI:Router = Router(), cb = null )=> {

    /*region User*/
    interface IAppsRequest extends IRequest {
        apps: AppsHandler
    }

    AppsAPI.use('/',
        Routing.registerUtility({
            apps: (req, res) => new AppsHandler()
        }));

    AppsAPI.all('/list', (req: IAppsRequest, res: IResponse) =>
        res.promiseAndSend(
            req.apps.getAppsFromUser(
                req.getUser().userId,
                req.getUser().assignedCompanyId,
                true
            ))
    )


    if(cb)cb(AppsAPI);

    return AppsAPI;
}

export default  AppsAPI ;