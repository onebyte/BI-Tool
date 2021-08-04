import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import {BaseAPI} from "../../../../../../packages/core/services/api.service";

interface IList{
  accountId: number
  code: number
  month: number
  name: string
  total: number
  year: number
}

interface IDataCollection{
  [year:number]:{
    [month:number]:{
      [accountId:number]:number
    }
  }
}

@Component({
  selector:     'app-report-revenue-year',
  templateUrl:  './report-revenue.component.html',
  styleUrls: [  './report-revenue.component.scss'],
  providers:[BaseAPI]
})
export class FinancesReportRevenueYearComponent implements OnInit {

  cYear = new Date().getFullYear()

  originalOrder           = (a: any, b: any): number => 0;

  accountsProducts        = {
    data:[],
    from:3000,
    till:3199,
    sum:{},
    name:'Produktionserlöse',
    isBetween(code,append:any = false){
      let valid = code>=this.from&& code<=this.till;
      if(append && valid){
        this.data.push(append)
      }
      return
    }
  }
  accountsTrade           = {
    data:[],
    from:3200,
    till:3299,
    sum:{},
    name:'Handelserlöse',
    isBetween(code,append:any = false){
      let valid = code>=this.from&& code<=this.till;
      if(append && valid){
        this.data.push(append)
      }
      return
    }
  }
  accountsServices        = {
    data:[],
    from:3400,
    till:3499,
    name:'Dienstleistungserlöse',
    sum:{},
    isBetween(code,append:any = false){
      let valid = code>=this.from&& code<=this.till;
      if(append && valid){
        this.data.push(append)
      }
      return
    }
  }
  accountsOthers          = {
    data:[],
    from:3500,
    till:3699,
    sum:{},
    name:'Übrige Erlöse aus Lieferungen und Leistungen',
    isBetween(code,append:any = false){
      let valid = code>=this.from&& code<=this.till;
      if(append && valid){
        this.data.push(append)
      }
      return
    }
  }
  accountsSalesReductions = {
    data:[],
    from:3800,
    till:3810,
    name:'Erlösminderungen',
    sum:{},
    isBetween(code,append:any = false){
      let valid = code>=this.from&& code<=this.till;
      if(append && valid){
        this.data.push(append)
      }
      return
    }
  }


  accountsCollection = [
    this.accountsProducts,
    this.accountsTrade,
    this.accountsServices,
    this.accountsOthers,
    this.accountsSalesReductions,
  ].sort((a, b) => a.from - b.from)

  data:IDataCollection = {}

  monthNames = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember']


  constructor(private reportAPI:BaseAPI<any, IList, any>) {
    this.reportAPI.register('finances/report/revenue');
    this.getData()
  }

  async getData(){
    await this.reportAPI.api<any[]>('/accounts/list',{
      codeFrom:3000,
      codeTill:3999
    }).then((accounts)=> {
      accounts.forEach(acc => this.accountsCollection.forEach(collection => collection.isBetween(acc.code,acc)))
    })
    this.reportAPI.list().then((data)=>{
      for(let i = 0; i<data.length;i++){

        if(!this.data[data[i].year])this.data[data[i].year] = {};
        if(!this.data[data[i].year][data[i].month])this.data[data[i].year][data[i].month] = {};

        this.data[data[i].year][data[i].month][data[i].accountId] = data[i].total ;

        let collection = this.accountsCollection.find(collection => collection.data.find(account =>{
          return account.accountId == data[i].accountId
        }))

        if(!collection){
          delete data[i].name
          console.warn('not found !collection');
          console.warn(data[i]);
          continue;
        }
        if(!collection.sum[data[i].year])collection.sum[data[i].year] = {[data[i].month]:0}
        if(!collection.sum[data[i].year][data[i].month])collection.sum[data[i].year][data[i].month] = 0
         collection.sum[data[i].year][data[i].month] += (data[i].total || 0)
      }

    })
    this.getChartData()
  }

  getChartData(){
    this.getRevenueChart()
  }

  ngOnInit() {}

  canShowCode(codeNr,from,till){
    return codeNr>= from && codeNr<= till
  }

  getSumOfYear(year,accountId){
    let total = 0;
    for(let month in this.data[year]){
      let val = this.data[year][month][accountId]
      if(val) total+= val
    }
    return total.toFixed(2)
  }

  getSumByMonthKeys(monthKeys){
    let total = 0;
    for(let key in monthKeys){
      total += monthKeys[key]
    }
    return total.toFixed(2)
  }

  getRevenueChart(){
    this.reportAPI.api<any>( '/revenue-chart-bymonth',{
      accountFrom:3001,
      accountTill:3499,
    })
    .then((datasets:any) => {
      new Chart(
        (<HTMLCanvasElement>document.getElementById('dl-revenue-chart')).getContext('2d'),
        {
          type: 'bar',
          data: {
            labels:this.monthNames.map( v => v.slice(0,3)),
            datasets:datasets
          },
          options: {
            plugins:{
              legend: {position: 'left',  labels: { font:{  size: 22}}},
            },
            elements: {},
            responsive: true,
          },
        }
      )
    });
    this.reportAPI.api<any>('/revenue-chart-bymonth',{
      accountFrom:3001,
      accountTill:3299,
    })
      .then((datasets:any) => {
        new Chart(
          (<HTMLCanvasElement>document.getElementById('hl-revenue-chart')).getContext('2d'),
          {
            type: 'bar',
            data: {
              labels:this.monthNames.map( v => v.slice(0,3)),
              datasets:datasets
            },
            options: {
              plugins:{
                legend: {position: 'left',  labels: { font:{  size: 22}}},
              },
              elements: {},
              responsive: true,
            },
          }
        )
      })


    this.reportAPI.api< { labels:any[], series:number[], colors:any[] }>('/revenue-chart-byaccount',{
      accountFrom:3400,
      accountTill:3499,
    })
      .then((dataset) => {

        new Chart(
          (<HTMLCanvasElement>document.getElementById('dl-revenue-chart-pie')).getContext('2d'),
          {
            type: 'pie',
            data:{
              labels:dataset.labels.map(v => v.replace('Bruttoerlöse','')),
              datasets: [
                {
                  data: dataset.series,
                  backgroundColor:dataset.colors
                }
              ]
            },
            options: {
              plugins:{
                legend: {position: 'left',  labels: { font:{  size: 22}}},

              },
              elements: {},
              responsive: true,

            },
          }
        )
        new Chart(
          (<HTMLCanvasElement>document.getElementById('dl-revenue-chart-bar')).getContext('2d'),
          {
            type: 'bar',
            data:{
              labels:dataset.labels.map(v => v.replace('Bruttoerlöse','')),
              datasets: [
                {
                  data: dataset.series,
                  backgroundColor:dataset.colors
                }
              ]
            },
            options: {
              plugins:{
                legend: {display:false, position: 'left',  labels: { font:{  size: 22}}},

              },
              elements: {},
              responsive: true,

            },
          }
        )
      })
    this.reportAPI.api< { labels:any[], series:number[], colors:any[] }>('/revenue-chart-byaccount',{
      accountFrom:3001,
      accountTill:3299,
    })
      .then((dataset) => {

        new Chart(
          (<HTMLCanvasElement>document.getElementById('hl-revenue-chart-pie')).getContext('2d'),
          {
            type: 'pie',
            data:{
              labels:dataset.labels.map(v => v.replace('Bruttoerlöse','')),
              datasets: [
                {
                  data: dataset.series,
                  backgroundColor:dataset.colors
                }
              ]
            },
            options: {
              plugins:{
                legend: {position: 'left',  labels: { font:{  size: 22}}},

              },
              elements: {},
              responsive: true,

            },
          }
        )
        new Chart(
          (<HTMLCanvasElement>document.getElementById('hl-revenue-chart-bar')).getContext('2d'),
          {
            type: 'bar',
            data:{
              labels:dataset.labels.map(v => v.replace('Bruttoerlöse','')),
              datasets: [
                {
                  data: dataset.series,
                  backgroundColor:dataset.colors
                }
              ]
            },
            options: {
              plugins:{
                legend: {display:false, position: 'left',  labels: { font:{  size: 22}}},

              },
              elements: {},
              responsive: true,

            },
          }
        )
      })
  }
}
