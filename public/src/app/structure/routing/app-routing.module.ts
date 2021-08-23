import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LayoutMainComponent } from "../../layouts/main/main.layout";
import { LayoutsModule } from "../../layouts/layouts.module";
import { FormsModule } from "@angular/forms";
import {LayoutAuthComponent} from "../../layouts/auth/auth.layout";
import {isLoggedIn} from "../../packages/core/auth/auth.service";

const routes: Routes = [
  ...['authentication','auth'].map(path => {
    return  {
      path: path,
      component: LayoutAuthComponent,
      children: [
        {
          path: '',
          loadChildren:()=> import('src/app/structure/pages/auth/auth.module').then(m => m.AuthModule),
        },
      ],
    }
  }),
  {
    path: '',
    component:LayoutMainComponent,
    canActivate:[isLoggedIn],
    children:[
      {
        path: 'dashboard',
        loadChildren: () => import('src/app/structure/routes/dashboard/dashboard.module').then(m => m.DashBoardModule),
      },
      {
        path: 'administration',
        loadChildren: () => import('src/app/structure/routes/administration/administration.module').then(m => m.AdministrationModule),
      },
      {
        path: 'productivity',
        loadChildren: () => import('src/app/structure/routes/productivity/productivity.module').then(m => m.ProductivityModule),
      },
      {
        path: 'finances',
        loadChildren: () => import('src/app/structure/routes/finances/finances.module').then(m => m.FinanceModule),
      }
    ]
  }
];

@NgModule({
  imports: [
    FormsModule,
    RouterModule.forRoot(routes, {  useHash:false, preloadingStrategy: PreloadAllModules }),
    LayoutsModule,
  ],
  exports: [RouterModule],
  providers:[isLoggedIn]
})
export class AppRoutingModule { }
