import {NextFunction, Response,Request} from "express";

import Database from "../../packages/database/Connection";

export enum IResponseTranslateMSG {
    NOACCESS  = 'msg_noaccess',
    NOTSAVED  = 'msg_nosuccupdate',
    SAVED     = 'msg_succadd',
    UPDATED   = 'msg_succupdate',
    DELETED   = 'msg_succdelete',
    FAILED    = 'msg_failed',
}
export enum IResponseHTTPCode {
    SUCCESS             = 200,
    BADREQ              = 400,
    NOACCESS            = 401,
    NOACCESSTOPROPERTY  = 406,

}

interface IResponseMessage{

    // dispaly Message to user
    notify?:boolean,

    // Message from server
    message?:string,

    // add prefix to message
    messagePrefix?:boolean,

    // translate message (without prefix)
    translate?:boolean,

    // date success state
    success?:boolean,

    type?:any,

    // force to realod page
    reload?:any,

    // force to relogin user
    reloadUser?:boolean,

    // session state
    session?:any

    cookies?:any[]
}
interface IResponseData{
    data:any,
    page?:any

}

export interface IResponse extends Response{

    sendAnswer(res:IResponse, data:IResponseData, status:IResponseHTTPCode, messsage?: IResponseMessage)

    endRequest(data?:any,stat?:any):void,

    sendFile(path:any):void,

    promiseAndSend(promise:Promise<any>,ops?,autoMsgType?:IResponseTranslateMSG | 'auto')

    promiseAllAndSend(arrayV:any[],arrayK:any[],keyOrArr?:string,autoMsgType?:IResponseTranslateMSG| 'auto')

}
export const ResponseUtils =  ( req:any , res:Response, next:NextFunction , db:Database ,pid:number = -1, opts:any = null )  => <any>({

    sendAnswer: async (res:IResponse, data:IResponseData, status:IResponseHTTPCode, opts?: IResponseMessage) => {

        if(opts === 'auto'){
            let state = status == 200 ? IResponseTranslateMSG.SAVED:IResponseTranslateMSG.FAILED
            opts = {message:state,notify:true,translate:true}
        }


        // DataHolder
        const sendback:any = {
            //   cId:    req.getCompany().companyId,
            pId:    pid,
            //    lId:    req.getUser().languageId,
            'data':    data,
            'message': opts,
            'status':  status,
        };

        // Kill Session
        /*
         if((!req.currentUser && sendback.message) || req.kill)
            if( !req.originalUrl.includes('hasAccessTo') && !req.originalUrl.includes('public') && !req.originalUrl.includes('auth') && typeof  sendback.message !== 'string')
            sendback.message['kill'] = true;
        * */

        if(opts && opts.cookies) {
            opts.cookies.forEach(cookie => {

                if(typeof cookie.value === 'function' ){
                    cookie.value =  cookie.value();
                }

                if(cookie.value !== undefined) res['cookie'](cookie.name , cookie.value     ,cookie.options)

            })
            delete  opts.cookies;
        }


        res.status(status).send(sendback);
    },

    promiseAndSend(promise, opts= {} , autoMsgType?:IResponseTranslateMSG | 'auto'){
        return new Promise(resolve => {

            if(autoMsgType){
                if(!opts)opts={}

                if(autoMsgType == 'auto'){
                    if( req.method == 'PUT')  autoMsgType =IResponseTranslateMSG.SAVED
                    if( req.method == 'PATCH') autoMsgType =IResponseTranslateMSG.UPDATED
                    if( req.method == 'DELETE') autoMsgType =IResponseTranslateMSG.DELETED
                }

                opts['translate'] = true;
                opts['notify']    = true;
                opts['message']   = autoMsgType;

            }


            if(promise && promise.then){
                promise.then(data=>{
                    this.sendAnswer(res, data , (data || {}).status || 200, opts)
                    resolve(data);
                }).catch((rejectData)=>{

                    if(rejectData && rejectData.status){
                        this.sendAnswer(res,null,rejectData.status,rejectData)
                        resolve(rejectData)
                    }else {
                        console.log(rejectData)
                        this.sendAnswer(res,null,500,{message:'CODE: #C1llB45C.1'})
                        resolve(null)
                    }
                })
            }
            else this.sendAnswer(res,null,500,{message:'CODE: #C1llB45C.2'})

        }).catch(()=>this.sendAnswer(res,null,500,{message:'CODE: #C1llB45C.3'}))
    },

    promiseAllAndSend(arys, keys = null, keyOrArr = 'array',answer={},autoMsgType?:IResponseTranslateMSG){
        return Promise.all(arys)
            .then((data:any) => {

                if(autoMsgType){
                    if(!answer)answer={};
                    answer['translate'] = true;
                    answer['notify']    = true;
                    answer['message']   = autoMsgType;
                }

                if(keys){
                    let obj = {}
                    let i = 0;
                    for(let k of keys){
                        if(keyOrArr == 'array'){
                            obj[k] = data[i]
                        }else {
                            console.log('key is not implemented yet')
                        }

                        i++;
                    }

                    this.sendAnswer(res,<any>obj,200,answer)
                }else {
                    this.sendAnswer(res,<any>data,200,answer)
                }

                return data
            }).catch(()=>null)
    },

    endRequest:( _data =[],status= 200)=>{
        res.send({
            'data':    _data,
            'message': '',
            'status':  status
        });
    },

    async  inject   ()  {

        const injector = this

        for (let key in   injector) {
            res[key] = injector[key];
        }

        return res;

    }

})