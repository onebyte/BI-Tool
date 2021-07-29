import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import { Observable } from "rxjs";
import {environment} from "../../../../environments/environment";

export enum EHttpMethod {
  get     = 'get',
  post    = 'post',
  save    = 'put',
  update  = 'patch',
  delete  = 'delete',
  blob    = 'post-blob',
}

@Injectable({
  providedIn: 'root'
})
export class Http {

  constructor(private http: HttpClient) {}

  static getURLBase(){
    return environment.api.endpoint + environment.api.version
  }

  private getTokenAndCred() {
    return {
      session:'',
      public_token:''
    };

  }

  static getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  static setCookie(name,value) {
    document.cookie += name + "=" + (encodeURIComponent(value || ""))  +';';
  }

  private getHeader(cOpts = {} ){
    let {session,public_token} = this.getTokenAndCred()
    let header =  {headers:  new HttpHeaders({
        'Authorization': environment.auth.app+ ' ' + session,
        'ptk'          : public_token,
        'content-type' :'application/json' ,
      }), withCredentials: true};
    if(header['headers']) for (let k in cOpts) header['headers'].append(k,cOpts[k])
    return header
  }


  /* API Call - Public */
  public api<T>(url: string, body: any, type:EHttpMethod | any = EHttpMethod.get, withCredentials:boolean = true, customHeaderOpts:any = {}):Promise<T> {

    const header = this.getHeader(customHeaderOpts);

    url = !url.includes('http') ? (Http.getURLBase() + url) : url;

    return new Promise(async (resolve) => {

      if( !url ) return resolve(null);

      // Call HTTP
      switch (type) {

        case 'delete'    :
          return resolve(this.doDeleteReq(url, header,body));

        case 'put'       :
          return resolve(this.doPutReq(url, header, body));

        case 'patch'     :
          return resolve(this.doPatchReq(url, header, body));

        case 'post'       :
          return resolve(this.doPostReq(url, header, body));

        case 'post-blob' :{
          header['responseType'] = 'blob'
          return resolve(this.doPostReq(url, header, body));
      }

        case 'get': return resolve(this.doGetReq(url,body, header))

      }

    });

  }

  /* API CALLS - Private */
  // todo remove response.error.data
  private doReq(fn:Observable<any>){
   return fn.toPromise()
        .then(result => this.handleResult(result))
         .catch((response) => this.handleError(response.error.message,response) )
  }

  private doGetReq(url: string,body, header){
    return this.doReq(this.http.get(url, {
      ...header,
      params: body
    }))
  }

  private doPutReq(url: string, header ,body:any){
    return this.doReq(this.http.put(url, body, header))
  }

  private doPatchReq(url: string, header:any , body){
    return this.doReq(this.http.patch(url, body, header))
  }

  private doPostReq(url: string, header:any , body){
    return this.doReq(this.http.post(url, body, header))
  }

  private doDeleteReq(url: string, header,body = {}){
    return this.doReq(this.http.delete(url,
      {
        ...header,
        params: body
      }))
  }

  // Response Handling

  private handleResult(result){
    // this.handleServerMessage(resolve,result,urlAPI + url)
    return result.data
  }

  private handleError(result,response){
    if(!result)result = {};

    /**
     if(response.status === 0){
      this.saveHttpRequest(url,body,options,'makeApiRequest',type)
    }

     if(response.session == 'end'){
      localStorage.clear()
      location.reload()
    }

     if(response.reload && !window.isMobile){
      location.reload(true)
    }

     if (response.status === 401) {

    }
     * */

    /*
    * Return the orginal result to the login section
    * */
    if(result.code == 'auth'){
      return result
    }

    return [];
  }

}


