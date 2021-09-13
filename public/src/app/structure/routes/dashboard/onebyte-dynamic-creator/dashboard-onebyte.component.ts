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
