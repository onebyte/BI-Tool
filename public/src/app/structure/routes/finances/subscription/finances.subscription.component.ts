import { Component, OnInit } from '@angular/core';
import {BaseAPI} from "../../../../packages/core/services/api.service";
import {Helper} from "../../../../packages/classes/helper/helper.table.class";
import Table = Helper.Table;
import Chart from 'chart.js/auto';


@Component({
  selector:    'app-finances.subscription',
  templateUrl: './finances.subscription.component.html',
  styleUrls: [ './finances.subscription.component.scss' ],
  providers: [BaseAPI]
})
export class FinancesSubscriptionComponent implements OnInit {

  table = new Table<any>([]);

  chart = {
    subscriptionTargets:{
      type:'doughnut',
      dataset:[],
      options:{cutout:'80%',plugins:{},text:'',maintainAspectRatio:false,responsive: true, }
    }
  }

  filterSettings = {
    start:new Date().getFullYear()+'-01-01',
    end:new Date().getFullYear()+'-12-31',
  }

  sum = {
    total:0,
    total_monthly:0
  }

  cYear=new Date().getFullYear();

  types = []

  constructor(private subscriptionAPI:BaseAPI<any, any, any>) {
    this.subscriptionAPI.register('finances/subscriptions');
    this.getData()
  }

  ngOnInit() {
    setTimeout(()=>
      this.getListData(),800)
  }

  getData(){
    this.getChartSubscriptions()
  }

  getListData(){
    this.table.values       = [];

    this.subscriptionAPI.list(this.filterSettings).then(rows => this.table.setValues(rows))
      .then(()=>{
        this.sum.total  = 0
        this.sum.total_monthly  = 0
      })
      .then(()=>this.table.values.forEach((value:any) => {
        this.sum.total += value.total;
        this.sum.total_monthly += value.total_monthly;
      }))

  }


  getChartSubscriptions(year = new Date().getFullYear()){

    this.subscriptionAPI.api<any>('chart-subscriptions-monthly-revenue',{year})
      .then(data => {
        if(!data)return;

        let chartEl:HTMLCanvasElement = <any>document.getElementById('chart-subscriptions-revenue');

        new Chart(chartEl.getContext("2d"), {
            type: 'line',
            data: {
              labels: [
                'Jan',
                'Feb',
                'Mär',
                'Apr',
                'Mai',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Okt',
                'Nov',
                'Dez'],
              datasets: [
                <any>{
                  fill: true,
                  backgroundColor: 'rgba(89, 122, 138,0.3)',
                  strokeColor : '#597a8a',
                  data:data.series
                }
              ]
            },
            options:{
              scales: {
                x:{
                  title: {
                    display: true,
                    text: 'CHF - Monatlich'
                  },
                },
                y: {
                  title: {
                    display: false,
                    text: 'Abos'
                  },
                  //suggestedMin: 0,
                  //suggestedMax: Math.max(...data.series)+4500,
                  ticks: {
                   // stepSize: 4000
                  }
                },
              },
              plugins: <any>{
                legend: {
                  display: false
                },
                annotation: {
                  annotations: {

                  }
                }
              },
            }
          });

      });

    this.subscriptionAPI.api<any>('chart-subscriptions-monthly',{year})
      .then(data => {
        if(!data)return;
        let index = data.years.findIndex(a => a == year)
        let chartEl:HTMLCanvasElement = <any>document.getElementById('chart-subscriptions-all');

        new Chart(chartEl.getContext("2d"), {
            type: 'bar',
            data: {
              labels: [
                'Jan',
                'Feb',
                'Mär',
                'Apr',
                'Mai',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Okt',
                'Nov',
                'Dez'],
              datasets: [
                <any>{
                  type: 'bar',
                  backgroundColor: '#597a8a',
                  data:data.series[index]
                }
              ]
            },
            options:{
              scales: {
                y: {
                  title: {
                    display: false,
                    text: 'Abos'
                  },
                  suggestedMin: 0,
                  suggestedMax: Math.max(...data.series[index])+2,
                  ticks: {
                    // forces step size to be 50 units
                    stepSize: 1
                  }
                },
                x:{
                  title: {
                    display: true,
                    text: 'Neue aktive Abos'
                  },
                }
              },
              plugins: <any>{
                legend: {
                  display: false
                },
                annotation: {
                  annotations: {

                  }
                }
              },
            }
          });

      });

    this.subscriptionAPI.api<any[]>('chart-subscriptions-sum',{byYear:true,max:5})
      .then(data => {

        let currentValues = data.find(a => (a.meta||a.year) == +new Date().getFullYear());

        if(!currentValues)return;

        const currentDayOfYear = (()=>{
          var now  = <any>new Date();
          var start = <any>new Date(now.getFullYear(), 0, 0);
          var diff = now - start;
          var oneDay = 1000 * 60 * 60 * 24;
          return  Math.floor(diff / oneDay);
        })


        const targetPerc = Math.floor( 100 / (365 / currentDayOfYear()));

        let targetVal   = currentValues.target || 0;
        let currentVal  = currentValues.value  || 0

        const currentPerc = targetPerc / (targetVal / currentVal)


        this.chart.subscriptionTargets.dataset = [{
          data:[
            currentPerc,
            targetPerc-currentPerc,
            100 -  targetPerc
          ],
          backgroundColor: [
            '#597a8a',
            ( currentVal-targetVal < 0 ?'#db6757':'#98b0bc'),
            '#ada79d'
          ],
          hoverOffset: 4
        }];
        this.chart.subscriptionTargets.options['text'] = currentValues.value
        this.chart.subscriptionTargets.options.plugins['tooltip'] = {
          displayColors: false,
          /*
           filter: function (tooltipItem, data) {
            return tooltipItem && tooltipItem.dataIndex < 2
          },
          * */
          callbacks: {
            title: function (tooltipItem, data) {

              switch (tooltipItem[0].dataIndex??tooltipItem.dataIndex){
                case 0: return 'Wert';
                case 1: return 'Ziel ' + targetVal;
                case 2: return '';
              }
            },
            label: function (tooltipItem, data) {
              if(!tooltipItem)return ;

              if(tooltipItem.dataIndex === 0){
                return currentVal
              }
              if(tooltipItem.dataIndex === 1){
                return ''
              }
              else if(tooltipItem.dataIndex == 2){
                return new Date().getFullYear()+' Resttage: '+ (365 - currentDayOfYear());
              }
              return' '+ (tooltipItem.parsed ).toFixed(2) +'%'
            },
            afterLabel: function (tooltipItem, data) {
              if(!tooltipItem)return ;
              if(tooltipItem.dataIndex === 1){
                return 'Diff: ' +( currentVal -targetVal   )+''
              }
              if(tooltipItem.dataIndex === 2){

              }
              return ''//'(' + currentPerc + '%)';
            }
          }
        }
      })

    this.subscriptionAPI.api<any[]>('chart-subscriptions-grouped',{year:new Date().getFullYear()})
      .then((data:any) => {

        this.types = data.rows;

        let chartEl:HTMLCanvasElement = <any>document.getElementById('chart-subscriptions-grouped');

        new Chart(chartEl.getContext("2d"), {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets: [
              <any>{
                type: 'bar',
                backgroundColor: '#ada79d',
                data:data.series
              }
            ]
          },
          options:{
            scales: {
              y: {
                title: {
                  display: false,
                  text: ''
                },
                suggestedMin: undefined,
                suggestedMax: undefined,
                ticks: {
                  // forces step size to be 50 units
                  stepSize: 1
                }
              },
              x:{
                title: {
                  display: true,
                  text: 'Kategorien'
                },
              }
            },
            plugins: <any>{
              legend: {
                display: false
              },
              annotation: {
                annotations: {

                }
              }
            },
          }
        });


      })

  }
}
