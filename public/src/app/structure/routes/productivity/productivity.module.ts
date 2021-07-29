import { CommonModule } from "@angular/common";
import { NgModule, Pipe } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from "@ionic/angular";
import {SharedChartsModule} from "../../../packages/components/charts/components.module";
import { TitleResolver } from "../../routing/app-routing.resolver";
import {ProductivityEmployeesComponent} from "./employees/productivity-employees.component";
import {ProductivityTeamsComponent} from "./teams/teams.component";

export const routes: Routes = [
   {
        path: 'employees',
        component: ProductivityEmployeesComponent,
        data: { title:'Produktivität - Mitarbeiter' },
        resolve: { title: TitleResolver }
   },
  {
    path: 'teams',
    component: ProductivityTeamsComponent,
    data: { title:'Produktivität - Teams' },
    resolve: { title: TitleResolver }
  },

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
     ProductivityEmployeesComponent,
     ProductivityTeamsComponent
  ],
   exports: [
    ],
   entryComponents: [

   ],
   providers: [

   ]
})
export class ProductivityModule { }
