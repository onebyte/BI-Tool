
//TODOS: Request Limitter
// TODO Move this to Auth base folder

import MiddlewareBase from "../../../core/routing/middleware/base.middleware";
import {NextFunction} from "express";
import {IRequest}     from "../core/request";
import {IResponse}    from "../core/response";
import {cryptoUtils}  from "../../packages/utils/crypto/crypto.utils";

export default class AuthMiddleware extends MiddlewareBase {

        public publicUrls:string[] = [
            ''
        ]

        private accessAPPEvent:string = 'auth:hasAccessToApps';

        private accessCompanyEvent:string = 'auth:hasAccessCompany';

        constructor(protected req:IRequest, protected res:IResponse, protected next:NextFunction,protected routes:any[]) {
            super(req, res, next,routes)
        }

        isAuthUrl(path:string = '/auth/'){
            return this.getURL().includes(path)
        }

        isPublicUrl(){
            return false //this.publicUrls.includes(path)
        }

        async register():Promise<boolean>{
            if(this.isAuthUrl())   return this.handleLoginRequests();
            else if(this.isPublicUrl()) return true;

            this.req.on(this.accessAPPEvent ,  async event => {

                    let appAccess = this.userCanUseApp(event);
                    if(!appAccess) return event.resolver(-1);

                    if(!this.userCanUseMethod(appAccess)) return event.resolver(-2);

                    return event.resolver(1);
                });
            //this.req.on(this.accessCompanyEvent, async ev => console.log('not implemented'));

            return true;

        }

        handleLoginRequests(){
          if(this.req.body.user && this.req.body.user.password) {
              this.req.body.user.password = cryptoUtils.hash(this.req.body.user.password,(this.req.body.user.username || this.req.body.user.email || ''))
              if(this.req['user'])this.req['user']['password'] = this.req.body.user.password;
          }
          return true
        }

        verifySession():Promise<boolean>{
          return  new Promise((resolve)=>{
              let uuId         = this.req.getCookie('uuId');
              let accessToken = this.req.getCookie('utk',true);
              let eId          = this.req.getCookie('eId')
              let cId          = cryptoUtils.decrypt(this.req.getCookie('cId'), process.env.APP_NAME||'company') ;

              if(!uuId || ! accessToken)return resolve(false);


          })
        }


        getUser(){
            return this.req.getUser();
        }

        userCanUseMethod(appAccess){
            if(appAccess.access === 'root'   ) return true;
            if(appAccess.access === 'delete' ) return  true;

            if(appAccess.access === 'read'  && this.getMethod() === 'GET')      return true;
            if(appAccess.access === 'write' && (this.getMethod() != 'DELETE' )) return true;

            return  false;
        }

        userCanUseApp(event){
            // todo create interface
           const ids = event.data;
           return this.getUser().appAccess.find(app => ids.includes(app.appId))
        }

        userCanAccessCompany(){
          this.getUser();
          return new Promise(resolve => resolve(true))
        }

}