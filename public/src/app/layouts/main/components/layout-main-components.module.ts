import {NgModule} from "@angular/core";
import {IonicModule} from "@ionic/angular";
import {CommonModule} from "@angular/common";
import { RouterModule } from "@angular/router";
import {MenuTopComponent} from "./menu/top/menu-top.component";
import {BreadcrumbsComponent} from "./breadcrumbs/breadcrumbs.component";


const TOPBAR = [
  BreadcrumbsComponent
]

const COMPONENTS = [
  MenuTopComponent,
  ...TOPBAR
];



@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    RouterModule
  ],
  declarations: [...COMPONENTS],
  exports:      [...COMPONENTS],
  providers:    [  ]
})
export class LayoutMainComponentsModule {}
