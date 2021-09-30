import { Component, OnDestroy, OnInit } from '@angular/core';
import { BaseAPI } from "../../../../packages/core/services/api.service";
import {DynamicChart} from "../onebyte-dynamic/dashboard-onebyte.component";




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
export class DashboardOnebyteDynamicCreatorComponent implements OnInit, OnDestroy {

  charts:DynamicChart[] = [];

  chart:DynamicChart;

  appSettings = {
    charts:[]
  }

  constructor(
    private api:BaseAPI<any, any, any>
  ){
    api.register('dashboard/dynamic-self');
    this.getData()
  }

  ngOnInit() {}

  getData(){
    this.api.api('appSettings',{
      appId:1.11,
    }).then((result:any)=>{
      if(result && typeof result.settings === "string"){
        const settings = JSON.parse(result.settings);
        settings.charts.sort((a,b)=>a.order-b.order).forEach(_chart => {
          _chart = new DynamicChart(_chart.accountIds,_chart);
          this.charts.push(_chart)
          this.appSettings.charts.push(_chart)
        });
      }

      this.charts.forEach(chart => {
        chart.onGetData = ( params) => this.api.api('accounts/list',params)
        chart.reloadData()
        chart.render()
      });

    })
  }

  async appendChart(){
    let chart   = this.chart;
    let isNew   = !chart['id']
    chart['id'] = chart['id'] || this.charts.length+1

    // reset data
    chart.data.series = [];

    if(isNew){
      chart.onGetData = ( params) => this.api.api('accounts/list',params)
      this.appSettings.charts.push(chart);
      this.charts.push(chart);
    }

    this.charts = this.charts.sort((a,b)=>a.order-b.order)
    await chart.reloadData();
    chart.render();

    this.chart = null;
    this.save()

  }

  edit(chart){
    this.chart = chart;
  }

  create(){
    this.chart = new DynamicChart([]);
  }

  save(){
    this.api.api('saveAppSettings',{
      settings: {
        charts: this.appSettings.charts.map( v => {
          return {
            id:    v.id,
            title: v.title,
            order: v.order,
            style: v.style,
            accountIds:v.getAccounts()
          }
        })
      }
    },'put')
  }

  delete(){
    let idx = this.appSettings.charts.findIndex(chart => chart['id'] == this.chart['id'])
    this.appSettings.charts.splice(idx,1)

     idx = this.charts.findIndex(chart => chart['id'] == this.chart['id'])
    this.charts.splice(idx,1);
    this.save()
    this.chart = null
  }

  ngOnDestroy(){
    this.charts = []
  }

  closeModal(){
    this.chart = null
  }

}
