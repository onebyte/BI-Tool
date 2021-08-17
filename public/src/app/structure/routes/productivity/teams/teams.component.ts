import { Component, OnInit } from '@angular/core';
import {BaseAPI} from "../../../../packages/core/services/api.service";

@Component({
  selector: 'app-p-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
  providers:[BaseAPI]
})
export class ProductivityTeamsComponent implements OnInit {

  teams = [];

  constructor(private api: BaseAPI<any,any,any>)
  {
    api.register('productivity/teams');
    this.getData()
  }

  ngOnInit() {}

  getData(){
    this.getTeams()
  }

  getTeams(){
    this.api.list({
      type:'G:TEAM'
    }).then((teams)=>this.teams = teams)
  }

}
