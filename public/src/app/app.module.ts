import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy, Platform} from '@ionic/angular';

import { AppComponent     } from './app.component';
import { AppRoutingModule } from './structure/routing/app-routing.module';
import { HttpClientModule } from "@angular/common/http";

import { Device       } from "@ionic-native/device/ngx"
import { ToastrModule } from "ngx-toastr";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NotyfToast } from "./packages/services/notifications/service.notification.toast";

const Natives    = [Device]
const Strategies = [{provide: RouteReuseStrategy, useClass: IonicRouteStrategy }]

import Annotation from 'chartjs-plugin-annotation';
import Chart from 'chart.js/auto';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {CheckForUpdateService} from "./packages/services/serviceworker.service";
Chart.register(Annotation);

@NgModule({
  declarations: [AppComponent,NotyfToast],
  entryComponents: [ NotyfToast ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    IonicModule.forRoot(),
    ToastrModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.pwa,
      scope:'/',
    })
  ],
  providers: [
    ...Strategies,
    ...Natives
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private device:Device,
              private platform:Platform,
              private sw:CheckForUpdateService) {
    this.setDeviceUUID();
  }

  generateUUID () { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16;//random number between 0 and 16
      if (d > 0) {//Use timestamp until depleted
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {//Use microseconds since page-load if supported
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  isCordova(){
    return this.platform.is('cordova')
  }

  setDeviceUUID(){
    window['_uuId'] = this.isCordova() ? this.device.uuid : ((cname)=>{ var name = cname + "="; var decodedCookie = decodeURIComponent(document.cookie); var ca = decodedCookie.split(';'); for(var i = 0; i <ca.length; i++) { var c = ca[i]; while (c.charAt(0) == ' ') { c = c.substring(1); } if (c.indexOf(name) == 0) { return c.substring(name.length, c.length); } } return ""; })('uuId') || localStorage.getItem('uuId') || this.generateUUID();
    if(window['_uuId'] == 0){
      window['_uuId'] = this.generateUUID()
    }
    localStorage.setItem('UUID', window['_uuId'])
  }
}
