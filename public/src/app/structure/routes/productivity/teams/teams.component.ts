import { Component, OnInit } from '@angular/core';
import {BaseAPI} from "../../../../packages/core/services/api.service";


interface IProductivityByUsersActivity {

  labelId:number

  firstName: string

  lastName: string

  profileImage: null

  userId: number

  year: number;

  month: number;

  // Total Worked Hours
  total: number;

  // % of Productivity
  perc: number

  activityId: number

  /* Linked Lists */
  users?:any
  revenue?:any
}

@Component({
  selector: 'app-p-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
  providers:[BaseAPI]
})
export class ProductivityTeamsComponent implements OnInit {

  users = [];

  teams = [];

  productivityByUsersActivity:IProductivityByUsersActivity[] = []

  constructor(private api: BaseAPI<any,IProductivityByUsersActivity,any>)
  {
    api.register('productivity/teams');
    this.getData()
  }

  ngOnInit() {}

  getData(){
    this.getUsers()
    this.getTeams()
    this.getProductivityUserActivityList();
  }

  getUsers(){
    this.api.api<any[]>('users',{
      visibility:true,
      simple:true
    }).then( (users)=> this.users = users)
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

  getTeamsLeaderLabel(ids){
    if(!ids)return''
    if(typeof ids === 'string') ids = ids.split(',');
    let leaders = []
    for(let i = 0;i<ids.length;i++){
      let id = ids[i];
      let user = this.users.find(user => user.userId == id)
      if(user){
        leaders.push(user.firstName)
      }
    }
    return  leaders.join(',')
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
    let total     = 0;
    let totalProd = 0;
    let count = 0;
    let totalEntries = this.productivityByUsersActivity.length;
    for(let i = 0;i<totalEntries;i++){
      let current = this.productivityByUsersActivity[i];
      if(current.userId == id){
        total     += current['total']
        totalProd += current['totalProd']  ;
        count++;
      }
    }

    return {
      total , totalProd
    };
  }

  calcProductivityByUserIds(ids){
    if(!ids) return '-';
    let total = 0;
    let totalProd = 0;
    ids.forEach(id => {
     let values = this.calcProductivityByUserId(id)
      total += values.total
      totalProd += values.totalProd
    });
    return Math.round((100/(total / totalProd)))
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

  calcHoursByUserId(id, key = 'total'){

    let total = 0;
    let count = 0;

    let totalEntries = this.productivityByUsersActivity.length;
    for(let i = 0;i < totalEntries;i++){
      let current = this.productivityByUsersActivity[i];
      if(current.userId == id){
        total     += current[key]
        count++;
      }
    }

    return total

  }

  calcHoursByUserIds(ids,key){
    if(!ids) return '-';
    let total = 0;
    ids.forEach(id => total += this.calcHoursByUserId(id,key));
    return total.toFixed(2);
  }

}
