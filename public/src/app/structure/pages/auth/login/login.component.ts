import { Component } from '@angular/core'


import { Device } from "@ionic-native/device/ngx";
import {ActivatedRoute, Router} from '@angular/router';

import {AuthFormBuilder} from "../auth-form.builder.Class";
import {AuthService} from "../../../../packages/core/auth/auth.service";
import {NotificationToastService} from "../../../../packages/services/notifications/service.notification.toast";

@Component({
  selector:    'app-login',
  templateUrl: './login.component.html',
  styleUrls: [ './login.component.scss'],
})
export class LoginComponent {

  fb         = new AuthFormBuilder();

  redirectTo = '/account';

  lang       = {
    de:{
      'emailinvalid': "E-Mail-Adresse ist ungültig.",
      'lengthinvalid':'Eingabe muss mindestens 6 Zeichen lang sein'
    }
  }

  constructor
  (
    public authService: AuthService,
    public device:      Device,
    public router:      Router,
    public  ac:         ActivatedRoute,
    public  notify:     NotificationToastService,
  ) {
    this.init();
  }

  init(){
    this.fb.addFormGroup('E-Mail-Adresse',   {id:'email',   type:'email',    containerClassName:'form-group mb-4', required: true, value:  sessionStorage.getItem('email') || ''})
    this.fb.addFormGroup('Passwort',         {id:'password',type:'password', containerClassName:'form-group mb-4', required:true, minLength: 6})

    this.fb.onSubmit.subscribe(()=> {
      let creds = this.fb.export();
      this.authService.signIn({uuId:this.getUUID(), ...creds})
        .then((result) => {

          if(result.user && result.user.isValid && result.user.isValid()){
            this.router.navigate(['/']);
            sessionStorage.setItem('app.menu.auto-navigate','1')
          }
          else if(result.path){
            this.router.navigate([
              result.path+'/'+creds['email']+'/'+result.pathParams.resetLink
            ])
          }
          else {

            let message  = result['message'];
            if( message == 'userdisabled'){
              this.notify.showError('Benutzer ist deaktiviert',
                'Bitte kontaktieren Sie den Administrator',{
                  timeOut:1000,
                  preventDuplicates:true
                })
            }
            else if(message == 'userblocked'){
              this.notify.showError('Benutzer wurde gespert',
                'Zu viele Login-Versuche.',{
                  timeOut:2000,
                  preventDuplicates:true
                })
            }
            else {
              this.notify.showError('Eingabe nicht korrekt','',{
                timeOut:1000,
                preventDuplicates:true
              })
            }
          }
          return result
        })
    });
  }

  onSuccess(){
    this.ac.paramMap.subscribe((param)=>{

      if(  param.get('path') ){
      } else this.router.navigate([this.redirectTo])
    })
  }

  getUUID(){
    return localStorage.getItem('UUID');
  }

}
