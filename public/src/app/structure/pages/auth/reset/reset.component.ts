import { Component, OnInit} from '@angular/core'
import { AuthFormBuilder   } from "../auth-form.builder.Class";

import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../../../packages/core/auth/auth.service";

@Component({
  selector: 'app-pw-reset',
  templateUrl: './reset.component.html',
  styleUrls:  ['./reset.component.scss'],
})
export class PasswordResetComponent implements OnInit {

  fb = new AuthFormBuilder()

  viewSettings = {
    visible:true,
    section: {
      idx:1,
      next(){
        this.idx++;
      },
    }
  }

  code;

  constructor(private authService:AuthService,
              private router:Router,
              ac:ActivatedRoute){
    this.init()
    ac.paramMap.subscribe((pm)=>{
      let mail = pm.get('mail');
      let code = pm.get('code');
      if(code){
        this.authService.forgot({
          code: code.split(':')[0],
          email: mail,
        })
          .then( (data:any) => {

            if( data.path === '/auth/reset' ){
              this.showSection.passwordChange()
              this.code = code;
              this.fb.getFormByLabel('Email').value = mail
            }
            if(data === false && code && mail){
              this.fb.title = 'Link abgelaufen';
              this.fb.mainText = 'Sie werden in kürze weitergeleitet';
              this.viewSettings.visible = false

              setTimeout(()=> this.router.navigate(['/auth']),4000)
            }
          })
      }
    })
  }

  ngOnInit() {
    this.viewSettings.section.idx = 1;
    this.fb.title      = '';
    this.fb.submitText = 'Zurücksetzten';
  }

  init(){

    this.fb.addFormGroup('Email',          {id:'email',   type:'email', required:true, section:1 ,exportGroup:'1'});

    this.fb.addFormGroup('Password',            {id:'password' , name:'password',    type:'password'  , required:true, section:3 ,placeholder:'Password eingeben',containerClassName:'pt-3',className:'',maxlength:20,exportGroup:'3' ,minLength:6,});
    this.fb.addFormGroup('Password wiederholen',{id:'password1', name:'password1',   type:'password'  , required:true, section:3 ,placeholder:'Password wiederholen',containerClassName:'pt-2',minLength:6,exportGroup:'3'});

    this.fb.onSubmit.subscribe((event)=> {

      // Get Code
      if(event.section === 1){
        this.authService.forgot(this.fb.export('1'))
        this.showSection.checkMail();
      }

      // Verify Code
      if(event.section === 2){
        this.authService.forgot({...this.fb.export('2'),...this.fb.export('1')})
          .then( data => {
            if( data.path === '/auth/reset' ){
              this.showSection.passwordChange();
            }
          })
      }

      // Submit Password
      if(event.section === 3){
        let pwIsSame = event.fields.find(f=>f.name == 'password').value === event.fields.find(f=>f.name == 'password1').value;
        if(pwIsSame){
          this.authService.reset({
            code: this.code,
            email:this.fb.getFormByLabel('Email').value,
            ... this.fb.export('3')}).then((result:any)=>{
            if(result.state === true){
              sessionStorage.setItem('email',this.fb.getFormByLabel('Email').value);
              // notify Changed success
              this.router.navigate(['/auth'])
            }
          })
        }
        else  {
          event.fields.find(f=>f.name == 'password1').error = 'Password nicht identisch'
        }
      }

    });

  }

  showSection=({
    checkMail:()=> {
      this.fb.title      = 'Email wurde versendet.';
      this.fb.mainText   = 'Sie erhalten in kürze eine Email mit dem Resetlink. <br> <small>Keine Email erhalten? Überprüfen Sie auch Ihre Junk Mails </small> ';
      this.fb.submitText = 'Erneut senden'
      this.viewSettings.section.idx = 2;
    },
    passwordChange:()=> {
      this.fb.title      = 'Geben Sie einen neuen Password ein';
      this.fb.mainText   = '';
      this.viewSettings.section.idx = 3;
    }
  })

  getErrorMsg(key){
    switch (key){
      case 'emailinvalid': return 'Email ist nicht korrekt.'
      default: return key;
    }
  }
}
