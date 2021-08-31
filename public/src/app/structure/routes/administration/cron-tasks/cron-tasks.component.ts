import { Component, OnInit } from '@angular/core';
import {AuthService} from "../../../../packages/core/auth/auth.service";
import {BaseAPI} from "../../../../packages/core/services/api.service";

@Component({
  selector: 'app-cron-tasks',
  templateUrl: './cron-tasks.component.html',
  styleUrls: ['./cron-tasks.component.scss'],
  providers:[BaseAPI]
})
export class CronTasksComponent implements OnInit {

  tasks = []

  constructor(
    private auth:    AuthService,
    private api: BaseAPI<any,any,any>
  )
  {
    api.register('administration/cron-task')
    this.getData()
  }

  getData(){
    this.api.list()
      .then(result => this.tasks = result)
  }

  ngOnInit() {}

}
