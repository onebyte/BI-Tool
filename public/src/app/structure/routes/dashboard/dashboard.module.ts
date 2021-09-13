import { CommonModule } from "@angular/common";
import { NgModule, Pipe } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from "@ionic/angular";
import {DashboardOnebyteComponent} from "./onebyte-main/dashboard-onebyte.component";
import {SharedChartsModule} from "../../../packages/components/charts/components.module";
import { TitleResolver } from "../../routing/app-routing.resolver";
import {DashboardOnebyteDynamicComponent} from "./onebyte-dynamic/dashboard-onebyte.component";
import {DashboardOnebyteDynamicCreatorComponent} from "./onebyte-dynamic-creator/dashboard-onebyte.component";

export const routes: Routes = [
      {
        path: 'onebyte/main',
        component: DashboardOnebyteComponent,
        data: { title:'Dashboard - Main' },
        resolve: { title: TitleResolver }
      },
      {
        path: 'onebyte/self',
        component: DashboardOnebyteDynamicCreatorComponent,
        data: { title:'Dashboard - Mein Dashboard' },
        resolve: { title: TitleResolver }
      },
      {
        path: 'onebyte/:type',
        component: DashboardOnebyteDynamicComponent,
        data: { title:'Dashboard - [APP]' },
        resolve: { title: TitleResolver }
      }
];

@NgModule({
   imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes),
        IonicModule,
        SharedChartsModule
    ],
   declarations: [
     DashboardOnebyteComponent,
     DashboardOnebyteDynamicComponent,
     DashboardOnebyteDynamicCreatorComponent
  ],
   exports: [
    ],
   entryComponents: [

   ],
   providers: [

   ]
})
export class DashBoardModule { }
