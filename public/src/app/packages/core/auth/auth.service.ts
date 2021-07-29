import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

import {environment} from "../../../../environments/environment";
import {Http} from "../services/http.service";
import {NotificationToastService} from "../../services/notifications/service.notification.toast";
import {StoreUser} from "../store/store.user";

@Injectable({providedIn: 'root'})
export class AuthService  {

  private urlBase   = environment.api.endpoint+`auth/`;

  public isLoggedIn = false;

  private encryptSensitiveData = false

  constructor(
    private router: Router,
    private http:   Http,
    private notify: NotificationToastService,
    private userStore:StoreUser) {
      this.onInit()
  }

  private onInit(){

  }

  public verifyEmail(email:string,key){
     return this.http.api(this.urlBase + 'verify-email', {
         uuId:this.getUuId(),
         key,
         user: this.verifyData({rand:Math.random(),email})
     },'post')
  }

  public verifySession(){
      if(this.isLoggedIn)return new Promise(resolve => resolve(true));

      if(this.getCookie('uuId'))
      return this.http.api<any>(this.urlBase + 'session', {
          uuId:window['_uuId'],
          user: this.verifyData({}) // rand:Math.random()
      },'post').then(data=> {
            this.isLoggedIn = data && data.valid
            if( data.valid ) this.userStore.initialise(data.user)
            return data;
          })
  }

  private getCookie(key){
    return ((cname)=>{ var name = cname + "="; var decodedCookie = decodeURIComponent(document.cookie); var ca = decodedCookie.split(';'); for(var i = 0; i <ca.length; i++) { var c = ca[i]; while (c.charAt(0) == ' ') { c = c.substring(1); } if (c.indexOf(name) == 0) { return c.substring(name.length, c.length); } } return ""; })(key);
  }

  public register(profileInfos,creds:any){
    return this.http.api(this.urlBase + 'register'     ,
        {
          ...profileInfos,
          user: this.verifyData(creds)
        }
        ,'post',true)
  }

  public signIn(creds:any){
    return this.http.api<{valid?:boolean,user:StoreUser,path?:any, pathParams?: {resetLink:string} } >(this.urlBase + 'signin' , {user: this.verifyData(creds)},'post',true)
        .then(data=> {
            if(data.user && data.user['id'] && data.user['valid'] === true){
              this.notifyMessage('success','Wilkommen '+ data.user['firstName'],'Du hast dich erfolgreich angemeldet!',{
                positionClass: 'toast-bottom-right',
              })
               const user      = this.userStore.initialise(data.user)
               this.isLoggedIn = true;
               user.storeLocal();
               return {user}
            }
            return data
        })
  }

  public signOut(){
    return this.http.api(this.urlBase + 'signout'    ,{},'delete')
      .then(()=>{
        this.router.navigate(['/auth']);
        [].map(v => localStorage.removeItem(v));
      })
  }

  public forgot(creds){
    return this.http.api<any>(this.urlBase + 'forgot'    ,{
        uuId:this.getUuId(),
        code:creds.code,
        user: this.verifyData(creds)
    },'post')
  }

  public reset(creds){
        return this.http.api(this.urlBase + 'reset'    ,{
            uuId:this.getUuId(),
            code:creds.code,
            user: this.verifyData(creds)
        },'post')
    }

  private verifyData(data){
   // if (this.encryptSensitiveData) return authUtils.crypto.encrypt(JSON.stringify(data))
   return data;
  }

  private getUuId(){
    return window['_uuId'];
  }

  notifyMessage(type,title,message = '',opts={}) {
    return this.notify.openNotyf(title,message,opts)
  }

}

@Injectable()
export class isLoggedIn implements CanActivate {

  constructor(private _router:Router, private auth:AuthService) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
   await this.auth.verifySession()
   if(!this.auth.isLoggedIn){
      this._router.navigate(['/auth'])
      return false
    }
    return true
  }

}
