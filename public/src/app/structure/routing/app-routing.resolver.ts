import { Injectable } from "@angular/core";
import { Resolve,ActivatedRouteSnapshot,RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs/internal/Observable";
import {TitleService} from "../../packages/core/services/dom/dom.title";


@Injectable({
  providedIn:'root'
})
export class TitleResolver implements Resolve<any> {
  constructor(private ts: TitleService) {}

  resolve(  route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>|Promise<any>|any {
    if(route.routeConfig.data && route.routeConfig.data['title']){
      if(route.routeConfig.data['title'].includes('[APP]')){
        this.ts.setTitle(route.routeConfig.data['title'].replace('[APP]',this.ts.appTitle))
      }else this.ts.setTitle(route.routeConfig.data['title'])
    }
    return true
  }
}
