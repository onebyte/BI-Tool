import { NgModule } from '@angular/core'


import { FormsModule, ReactiveFormsModule } from '@angular/forms'

// system pages
import { LoginComponent } from './login/login.component'

import {PasswordResetComponent} from "./reset/reset.component";
import { RouterModule, Routes} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";
import {CommonModule} from "@angular/common";

const COMPONENTS = [
  LoginComponent,
  PasswordResetComponent
]

const routes: Routes = [
  { path: 'reset',  component: PasswordResetComponent , data: { title: 'Reset' }},
  { path: 'reset/:mail/:code',  component: PasswordResetComponent , data: { title: 'Reset' }},
  { path: '',  component: LoginComponent , data: { title: 'Login' }},
]


@NgModule({
    imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule.forChild(routes)],
      declarations: COMPONENTS,
})
export class AuthModule {}
