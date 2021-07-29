import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseAPI } from "../../../../packages/core/services/api.service";


class DynamicChart {

  public title

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
    this.onGetData({
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

}

@Component({
  selector: 'dashboard-onebyte-dynamic',
  templateUrl: './dashboard-onebyte.component.html',
  styleUrls: ['./dashboard-onebyte.component.scss'],
  providers:[BaseAPI]
})
export class DashboardOnebyteDynamicComponent implements OnInit, OnDestroy {

  charts:DynamicChart[] = [];

  type = location.href.split('/').pop();

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
      case 'tech':{
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
            title:'Support on demoand',
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

        // Revenue
        this.charts.push(
          new DynamicChart([
            ... this.charts.map(c => {

              return c.getAccounts();
            })
          ],{
            title:'Umsatz',
            style:{
              width:12,
              widthXl:12
            }
          })
        );
        break;
      }

      case 'creation':{
        this.charts.push(
          new DynamicChart([
            3402
          ],{
            title:'Bruttoerlöse Kreation',
            style:{
              width:12,
              widthXl:4
            }
          })
        );
        break
      }

      case 'marketing':{
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
        // Revenue
        this.charts.push(
          new DynamicChart([
            ... this.charts.map(c => {

              return c.getAccounts();
            })
          ],{
            title:'Umsatz',
            style:{
              width:12,
              widthXl:12
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
