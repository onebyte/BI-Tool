import {UserListPage} from "./user/list/user-list";
import {RouterModule, Routes} from "@angular/router";
import {UserRolesPage} from "./user/userrole/user-roles";
import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {IonicModule} from "@ionic/angular";
import {BaseAPI} from "../../../packages/core/services/api.service";
import {RoleDialogComponent} from "./user/userrole/role-dialog/role-dialog.component";
import {GroupListPage} from "./team/group/list/group-list";
import {GroupDialogComponent} from "./team/group/group-dialog/group-dialog.component";
import {ManualEntriesPage} from "./manual-entries/manual-entries.component";
import {DataEntryDialogComponent} from "./manual-entries/entry-dialog/entry-dialog.component";
import {TitleResolver} from "../../routing/app-routing.resolver";
import {CronTasksComponent} from "./cron-tasks/cron-tasks.component";

export const routesAdministration: Routes = [
  { path: 'user/list', component: UserListPage ,
    data: { title:'Benutzerübersicht' },
    resolve: { title: TitleResolver }},
  { path: 'user/role', component: UserRolesPage ,
    data: { title:'Rechte und Rollen' },
    resolve: { title: TitleResolver }},

  { path: 'manual/entries', component: ManualEntriesPage ,
    data: { title:'Manuelle Einträge' },
    resolve: { title: TitleResolver }
  },
  { path: 'team/group/list', component: GroupListPage ,
    data: { title:'MA - Kreise' },
    resolve: { title: TitleResolver }
  },
  { path: 'cron-task/list', component: CronTasksComponent ,
    data: { title:'Cron Tasks' },
    resolve: { title: TitleResolver }
  },
];

@NgModule({
  imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routesAdministration),
        IonicModule,
    ],
  declarations: [
    UserListPage,
    UserRolesPage,
    GroupListPage,
    RoleDialogComponent,
    GroupDialogComponent,
    DataEntryDialogComponent,
    ManualEntriesPage,
    CronTasksComponent
  ],
  entryComponents:[
    RoleDialogComponent,
    DataEntryDialogComponent,
    GroupListPage
  ],
  providers:[BaseAPI]
})
export class AdministrationModule { }
