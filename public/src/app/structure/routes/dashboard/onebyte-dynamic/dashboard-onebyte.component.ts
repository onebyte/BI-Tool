import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseAPI } from "../../../../packages/core/services/api.service";



export class DynamicChart {

  public title

  public order = 0;

  private visible = false

  public style = {
    width :   6,
    widthSm : 12,
    widthXl:  6
  }

  public data = {
    series:[],
    labels:[]
  }


  constructor(private accountIds,options = {}) {
    Object.assign(this,options)
  }

  reloadData(){
    return this.onGetData({
      accounts:this.accountIds
    }).then((data:any) => {
      this.data.series = data.series
      this.data.labels = data.years
    })
  }

  onGetData(params){
    return new Promise(resolve => resolve([]))
  }

  render(){
    this.visible = false;

    setTimeout(()=> this.visible = true,100)
  }

  getAccounts(){
    return this.accountIds
  }
  getAccountAsString(){
    return this.accountIds.join(',')
  }
  setAccountFromString(accounts){
    return this.accountIds = accounts.split(',')
  }

}


/**
 * All accoutns (revenue)
 [
 ... this.charts.map(c => {
      return c.getAccounts();
     })
 ]
 * */

@Component({
  selector: 'dashboard-onebyte-dynamic',
  templateUrl: './dashboard-onebyte.component.html',
  styleUrls: ['./dashboard-onebyte.component.scss'],
  providers:[BaseAPI]
})
export class DashboardOnebyteDynamicComponent implements OnInit, OnDestroy {

  charts:DynamicChart[] = [];

  type = location.href.split('/').pop();

  /** this page is allowed only to fetch these
   [
    3406,3409,3402,3408,3407,3403
   ]
  **/

  constructor(
    private dashBoardAPI:BaseAPI<any, any, any>
  ){
    dashBoardAPI.register('dashboard/dynamic');
    this.initType()
    this.getData()
  }

  ngOnInit() {}

  initType(){
    switch (this.type){
      case 'tech' : {
        // Revenue
        this.charts.push(
          new DynamicChart([
            3408,3407,3403
          ],{
            title:'Umsatz',
            style:{
              width:12,
              widthXl:12
            }
          })
        );
        // sla
        this.charts.push(
          new DynamicChart([
            3408
          ],{
            title:'Support SLA',
            style:{
              width:12,
              widthXl:4
            }
          })
        )
        // support on demoand
        this.charts.push(
          new DynamicChart([
            3407
          ],{
            title:'Support on demand',
            style:{
              width:12,
              widthXl:4
            }
          })
        )
        // coding
        this.charts.push(
          new DynamicChart([
            3403
          ],{
            title:'Programmierung & Aufbau',
            style:{
              width:12,
              widthXl:4
            }
          })
        )
        break;
      }

      case 'creation' :{
        this.charts.push(
          new DynamicChart([
            3402
          ],{
            title:'Bruttoerlöse Kreation',
            style:{
              width:12,
              widthXl:12
            }
          })
        );
        break;
      }

      case 'marketing' :{
        // Revenue
        this.charts.push(
          new DynamicChart([
            3406,3409,
          ],{
            title:'Umsatz',
            style:{
              width:12,
              widthXl:12
            }
          })
        );
        this.charts.push(
          new DynamicChart([
            3409
          ],{
            title: 'Bruttoerlöse Onlinemarketing SLA',
            style:{
              width:12,
              widthXl:4
            }
          })
        );
        this.charts.push(
          new DynamicChart([
            3406
          ],{
            title: 'Bruttoerlöse Onlinemarketing on Demand',
            style:{
              width:12,
              widthXl:4
            }
          })
        );
      }
    }
  }
  getData(){
    this.charts.forEach(chart => {
      chart.onGetData = ( params) => this.dashBoardAPI.api('accounts/list',params)
      chart.reloadData()
      chart.render()
    })
  }


  ngOnDestroy(){
    this.charts = []
  }

}
