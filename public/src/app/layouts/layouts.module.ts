import { NgModule } from '@angular/core'

import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";


import {LayoutMainComponentsModule} from "./main/components/layout-main-components.module";
import {LayoutMainComponent} from "./main/main.layout";
import {LayoutAuthComponent} from "./auth/auth.layout";


const LAYOUTS            = [
  LayoutMainComponent,
  LayoutAuthComponent
];


const DIRECTIVES      = [

]


@NgModule({
  imports: [
    IonicModule,
    FormsModule,
    CommonModule,
    RouterModule,
    LayoutMainComponentsModule
  ],
  declarations: [ ...LAYOUTS, ...DIRECTIVES, ],
  exports:      [ ...DIRECTIVES] ,
  providers:    []
})
export class LayoutsModule {}
