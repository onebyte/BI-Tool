import { Component, OnInit } from '@angular/core';
import {BaseAPI} from "../../../../packages/core/services/api.service";


interface IProductivityByUsersActivity {

  labelId:any

  firstName: null
  lastName: null
  month: 8
  perc: number
  profileImage: null
  total: number
  userId: number
  activityId: number
  year: number

  users:any
  revenue:any
}

@Component({
  selector: 'app-p-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
  providers:[BaseAPI]
})
export class ProductivityTeamsComponent implements OnInit {

  teams = [];

  productivityByUsersActivity:IProductivityByUsersActivity[] = []
  constructor(private api: BaseAPI<any,IProductivityByUsersActivity,any>)
  {
    api.register('productivity/teams');
    this.getData()
  }

  ngOnInit() {}

  getData(){
    this.getTeams()
    this.getProductivityUserActivityList();
    console.log(this)
  }

  getTeams(){
    this.api.list({
      type:'G:TEAM'
    }).then(async (teams)=>
    {

      for(let i = 0;i<teams.length;i++){
        let team = teams[i];
        if(team.users && typeof team.users === 'string'){
          team.users = team.users.split(',')
        }
        team.revenue = await this.getRevenueFromGroup(team.labelId)
      }

      this.teams = teams;
    })
  }

  getRevenueFromGroup(labelId){
    return this.api.api('list-revenue',{labelId})
  }

  getProductivityUserActivityList(){
    this.api.api<IProductivityByUsersActivity[]>('list-productivity-users-activity',{})
      .then(data => this.productivityByUsersActivity = data )
  }

  calcHoursByActivityId(id){
    let total = 0;
    let count = 0;
    let totalEntries = this.productivityByUsersActivity.length;
    for(let i = 0;i<totalEntries;i++){
      let current = this.productivityByUsersActivity[i];
      if(current.activityId == id){
        total += current.total || 0;
        count++;
      }
    }
    return total;
  }

  calcProductivityByActivityId(id){
    let total = 0;
    let count = 0;
    let totalEntries = this.productivityByUsersActivity.length;
    for(let i = 0;i<totalEntries;i++){
      let current = this.productivityByUsersActivity[i];
      if(current.activityId == id){
         total += current.perc || 0;
         count++;
      }
    }
    if(!total &&!count) return 0
    return total / count;
  }

  calcProductivityByUserId(id){
    let total = 0;
    let count = 0;
    let totalEntries = this.productivityByUsersActivity.length;
    for(let i = 0;i<totalEntries;i++){
      let current = this.productivityByUsersActivity[i];
      if(current.userId == id){
        total += current.perc || 0;
        count++;
      }
    }
    if(!total &&!count) return 0
    return total / count;
  }

  calcProductivityByUserIds(ids){
    if(!ids) return '-';
    let total = 0;
    ids.forEach(id => total += this.calcProductivityByUserId(id));
    if(total == 0) return 0;
    return (total / ids.length).toFixed(2)
  }

  calcProductivityByActivityIds(ids){
    if(!ids) return '-';
    let total = 0;
    ids.forEach(id => total += this.calcProductivityByActivityId(id));
    if(total == 0) return 0;
    return (total / ids.length).toFixed(2)
  }

  calcHoursByActivityIds(ids){
    if(!ids)return '-';
    let total = 0;
    ids.forEach(id => total += this.calcHoursByActivityId(id));
    return total.toFixed(2)
  }

  calcRevenue(revenue){
    let total = 0;
    if( revenue ) {
      for(let i = 0; i<revenue.length; i++)
        total += revenue[i].total
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CHF' }).format(total);
  }
}
