import {NextFunction, Request, Response} from "express";
import moment = require("moment");

import Database from "../../packages/database/Connection";
import {AuthUser} from "../../packages/models/User.Model";
import {cryptoUtils} from "../../packages/utils/crypto/crypto.utils";

export interface IRequest  extends Request {

    body:           any,

    files:          any,

    urlParts    :   string[]

    originalUrl:    string

    method:         string,

    // DB / Ids and Helper
    getDB():Database,

    getCookie(name?,_secure?:boolean):  string,

    getUser():AuthUser

    getIP(r?):any,

    getRequestId():any,

    waitForIt(ms):Promise<null>,

    // Access
    hasAccessToApps(appIds:any[]):any,

    // Parameters and Values
    hasParameter(string):any,

    getParameter<T>(string?:string,defaultValue?:string):T,

    getRequestQuery(): {
        queryParams:any, queryExport:any[]
    },

    getDefaultParameter():any,

    getDefaultParameterWithClass<T>(_class:any):T,

    getID(fallBack?):number|string|null,

    // Date
    getDate(params?:any,date?:any,format?:string),


    //translate():ITranslate,

    //log(companyId:number, msg:string, userIdOrSystem?:string, file?:string, db?:boolean):ILog


}
export const RequestUtils = ( req:any , res:Response, next:NextFunction ,db:Database  ,pid:number=-1, opts:any = null ) => (<any>{

    waitForIt: (ms) => new Promise(re => setTimeout(re, ms)),

    getCookie: (name = 'tk', secure = true) => {
        try {
            if(req.cookies[name])return req.cookies[name]

            const cookies = req['_get']('Cookie').split(' ');
            const tk = cookies.findIndex(tk => tk.indexOf(name + '=') >= 0);

            if (secure) {
                return cookies[tk].replace(name + '=', '').replace(';', '').replace(' ', '');
            } else {
                return req['body'][name] || cookies[tk].replace(name + '=', '').replace(';', '').replace(' ', '');
            }

        } catch (e) {
            if (secure) {

                if (name == 'cId') {
                    return req.headers[name] || req.headers['Company'] || 'null';
                } else
                    return req.headers[name] || 'null';
            } else
                return req.headers[name] || req['body'][name] || 'null';
        }
    },


    /*
       {
                    name: 'utk',
                    value: () => req['user']['accessToken'],
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: true, path: '/'}
                },
                {
                    name: 'uuId',
                    value: () => req.body.user.uuId,
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: false, path: '/'}
                },
                {
                    name: 'eId',
                    value: () => cryptoUtils.encrypt(req.user.email, 'email'),
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: true, path: '/'}
                },
                {
                    name: 'cId',
                    value: () => cryptoUtils.encrypt(req.user.assignedCompanyId + '', 'company'),
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: true, path: '/'}
                },
    * */

    // access login token
    getUserToken(){
        return this.getCookie('utk')
    },

    getCompanyToken(){
        return this.getCookie('ctk')
    },

    getDB: () => {
        return db;
    },

    getDate: (param: any, date = null, f = null): moment.Moment | string => {

        if (param == 'sql') f = 'YYYY-MM-DD';

        if (f) return date ? moment(date).format(f) : moment().format(f);

        return date ? moment(date) : moment();
    },

    async getUser(forceReload = false){

        if(req['user']  && !forceReload){
            return req['user'];
        }

        req['user'] = new AuthUser(req.body.user ? req.body.user : null);

        if(this.getCookie('uuId',false))
        {
            await  (<AuthUser>req.user).doSessionCheck(
                this.getCookie('uuId',false),
                this.getUserToken(true),
                this.getCookie('eId'),
                true
            )
        }


        return req.user;

    },


    // Access


    // Value and Parameter
    getParameter: (parm = 'Target', parm1) => req.body[parm] || req.params[parm] || req.query[parm] ||tryParse(req._get(parm)) || parm1,

    getDefaultParameter: () => {
        if(isEmpty(req.body)) return  req.query || req.params;
        return req.body;
    },

    getRequestQuery:()=> {
        let params = req.getDefaultParameter();
        return params && params.request ?  params.request : {queryParams:{}, queryExport:[]}
    },

    getDefaultParameterWithClass: (_class) => {
        return new _class(req.getDefaultParameter());
    },

    hasParameter: x => {
        return req.getDefaultParameter()[x];
    },

    getID: (fallBack = null) => {
        let parameters = req.getDefaultParameter();

        let {id, selfOnly} = parameters;

        id = id || req.query['id'] || req.params['id']

        //current user
        if (selfOnly) {
            return req.getUser().userId;
        }

        if (id === undefined && fallBack)
            return parameters[fallBack] || id;

        if(typeof id === "object" && id[0]){
            return  id[0]
        }

        return id;
    },

    getRequestId() {
        return ((moment().valueOf() - moment().unix() + Math.floor(Math.random() * 100)) + '').substr(8) + '' + Math.floor(Math.random() * 100) + '' + this.getCompany().companyId + '' + req.getUser().userId;
    },

    getIP(r = null) {
        const _req = r || req;
        return _req.headers['x-forwarded-for']
            || _req.headers['x-real-ip'] ||
            _req.connection.remoteAddress ||
            _req.socket.remoteAddress ||
            (_req.connection.socket ? _req.connection.socket.remoteAddress : 'not found');

    },

})

const tryParse = (json) =>  {try {json = JSON.parse(json);} catch(SyntaxError) {}return json}

const isEmpty = (obj) =>  {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}