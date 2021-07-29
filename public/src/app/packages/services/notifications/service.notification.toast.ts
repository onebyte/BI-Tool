import {Injectable} from "@angular/core";
import { Component } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationToastService{



  constructor(private toastr: ToastrService) {

  }

  showError(title,message = '',_opt={}) {
    const opt =  {...this.toastr.toastrConfig,..._opt};
    this.toastr.error(message,title,opt);
  }
  showSuccess() {
    //this.toastr.success('You have successfully logged in!', 'Logged In');
  }

  openNotyf(title,message,opts = {}) {
    const opt =  {...this.toastr.toastrConfig,...opts};
    opt.toastComponent = NotyfToast;
    opt.toastClass = 'notyf confirm';

    // opt.positionClass = 'notyf__wrapper';
    // this.options.newestOnTop = false;
    return this.toastr.show(message , title, opt);
  }
}

import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {Toast, ToastPackage, ToastrService} from "ngx-toastr";
@Component({
  selector: 'notyf-toast-component',
  styles: [],
  template: `
    <div class="notyf__toast notyf__toast--success "
         [class.notyf__shadow]="shadow"
         [style.backgroundColor]="initBgColor">
      <div class="notyf__wrapper">
        <div class="notyf__icon">
          <i class="notyf__icon--success" style="color: rgb(61, 199, 99);"></i>
        </div>
        <div class="notyf__message text-dark">
          <b>{{ title }}</b><br>
          {{ message }}</div>
      </div>
      <div
        class="notyf__ripple"
        [style.backgroundColor]="color"
      ></div>
    </div>
  `,
  animations: [
    trigger('flyInOut', [
      state('inactive', style({ opacity: 0 })),
      transition(
        'inactive => active',
        animate(
          '300ms ease-out',
          keyframes([
            style({
              opacity: 0,
              bottom: '-15px',
              'max-height': 0,
              'max-width': 0,
              'margin-top': 0,
            }),
            style({
              opacity: 0.8,
              bottom: '-3px',
            }),
            style({
              opacity: 1,
              bottom: '0',
              'max-height': '200px',
              'margin-top': '12px',
              'max-width': '400px',
            }),
          ]),
        ),
      ),
      state(
        'active',
        style({
          bottom: '0',
          'max-height': '200px',
          'margin-top': '12px',
          'max-width': '400px',
        }),
      ),
      transition(
        'active => removed',
        animate(
          '300ms ease-out',
          keyframes([
            style({
              opacity: 1,
              transform: 'translateY(0)'
            }),
            style({
              opacity: 0,
              transform: 'translateY(25%)'
            }),
          ]),
        ),
      ),
    ]),
  ],
})
export class NotyfToast extends Toast {
  initBgColor = 'transparent'
  color = 'white' // notyf__ripple ng-tns-c141-0
  shadow = false;
  constructor(
    protected toastrService: ToastrService,
    public toastPackage: ToastPackage,
  ) {
    super(toastrService, toastPackage);
    setTimeout(()=> this.shadow = true,100)
  }
}
