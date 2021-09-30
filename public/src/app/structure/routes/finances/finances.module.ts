import { CommonModule } from "@angular/common";
import { NgModule, Pipe } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from "@ionic/angular";
import {FinancesAccountOverviewPage} from "./accounting/overview/page-finances-account-overview";
import {FinancesReportRevenueYearComponent} from "./report/revenue/year/report-revenue.component";
import {FinancesSubscriptionComponent} from "./subscription/finances.subscription.component";
import {TitleResolver} from "../../routing/app-routing.resolver";
import {SharedChartsModule} from "../../../packages/components/charts/components.module";
import {FinancesReportRevenueMonthlyClosingComponent} from "./report/revenue/month/report-monthly-closing.component";

export const routesFinances: Routes = [
      { path: 'accounts/overview',                component: FinancesAccountOverviewPage ,
        data: { title:'Konto - Übersicht' },
        resolve: { title: TitleResolver }
      },
      { path: 'report/revenue/year',              component: FinancesReportRevenueYearComponent ,
        data: { title:'Umsatz - Übersicht' },
        resolve: { title: TitleResolver }
      },
     { path: 'report/revenue/month',              component: FinancesReportRevenueMonthlyClosingComponent ,
        data: { title:'Monatsabschluss / Transaktionsübersicht' },
        resolve: { title: TitleResolver }
      },
      { path: 'subscription/list',                component: FinancesSubscriptionComponent ,
        data: { title:'Abos - Übersicht' },
        resolve: { title: TitleResolver }
      },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routesFinances),
        IonicModule,
        SharedChartsModule,
    ],
   declarations: [
     FinancesAccountOverviewPage,
     FinancesReportRevenueYearComponent,
     FinancesSubscriptionComponent,
     FinancesReportRevenueMonthlyClosingComponent
  ],
   exports: [
    ],
   entryComponents: [

   ],
   providers: [

   ]
})
export class FinanceModule { }
