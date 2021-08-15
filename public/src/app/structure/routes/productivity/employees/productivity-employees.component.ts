import { Component, OnInit, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto'
import Choices from 'choices.js';

import {BaseAPI} from "../../../../packages/core/services/api.service";



@Component({
  selector: 'app-productivity-employees',
  templateUrl: './productivity-employees.component.html',
  styleUrls: ['./productivity-employees.component.scss'],
  providers:[BaseAPI]
})
export class ProductivityEmployeesComponent implements OnInit {

  cYear = new Date().getFullYear()

  filterParams = {
    years: [this.cYear],
    months:[],
    users:{},
    billable:'',
    didChangeRange:false
  }

  activities = [];

  users      = [];
  usersLabel = []
  usersScoreBoard = []

  data       = {};

  cache      = {}

  years      = [];

  months     = [
    1,2,3,4,5,6,7,8,9,10,11,12
  ];

  chart = {
    users:{
      year:new Date().getFullYear(),
      data:{
        labels: null,
        datasets: []
      }
    },
    bubble:{
      visible:true,
      year:new Date().getFullYear(),
      month:new Date().getMonth()+1,
    },
    productivityTargets:{
      type:'doughnut',
      dataset:[],
      options:{cutout:'80%',plugins:{},text:'',maintainAspectRatio:false,responsive: true, }
    },
    billable:        {
      labels:[],
      series:[]
    },
  }


  //elements
  @ViewChild('usersEl' ,    { static: true}) usersEL:  { nativeElement: HTMLInputElement };
  @ViewChild('yearFromEl' , { static: true}) yearsFromEL:  { nativeElement: HTMLInputElement };
  @ViewChild('monthFromEl' ,{ static: true}) monthFromEl:  { nativeElement: HTMLInputElement };


  constructor(private productivityAPI:BaseAPI<any,any,any>) {
    productivityAPI.register('productivity/employees');
    this.getData();
  }

  ngOnInit() {

  }

  initChoices(){
    this.usersEL.nativeElement['choises']     = new Choices(this.usersEL.nativeElement);
    this.yearsFromEL.nativeElement['choises'] = new Choices(this.yearsFromEL.nativeElement);
    this.monthFromEl.nativeElement['choises'] = new Choices(this.monthFromEl.nativeElement);
  }

  getData(all = true){

    if(all){
      this.getRange()
    }

    Promise.all([
      this.getActivities(),
      this.getUsers(),
      this.getList(),
    ]).then(()=> {
      this.initChoices();
    })
    this.getChartData();
    this.getProductivityUserScoreList()
  }

  getActivities(){
   return  this.productivityAPI.api<any[]>(
      'activities/list',{}
    ).then(a => this.activities = a);
  }

  getUsers(){
   return  this.productivityAPI.api<any[]>(
      'users/list',{}
    ).then(a => this.users = a)
  }

  getRange(){
    return  this.productivityAPI.api<{maxYear:number,minYear:number}>(
      'data-range',{}
    ).then(a =>{
      this.years = []
      if(a){
        for(let i = 0;i<=a.maxYear - a.minYear;i++)
        this.years.push(a.minYear+i)
      }else {
        this.years = [new Date().getFullYear()]
      }
    });
  }

  getList(){
    this.data = {}
    return this.productivityAPI.list({billable:this.filterParams.billable})
      .then(data => {
        this.data = {}
        let total = data.length;
        for(let i = 0; i<total;i++){
          let entry = data[i]

          if(!this.data[data[i].userId])this.data[data[i].userId] = {};
          if(!this.data[data[i].userId][data[i].activityId])this.data[data[i].userId][data[i].activityId] = {};

          if(!this.data[data[i].userId][data[i].activityId][data[i].year])this.data[data[i].userId][data[i].activityId][data[i].year] = {};
          if(!this.data[data[i].userId][data[i].activityId][data[i].year][data[i].month])this.data[data[i].userId][data[i].activityId][data[i].year][data[i].month] = {};

          this.data[data[i].userId][data[i].activityId][data[i].year][data[i].month] = {
            value:entry.value,
            total:entry.total,
          }
        }


      })
  }

  getSumChart(){
    this.productivityAPI.api<any[]>('chart-productivity-sum',{byYear:true,max:5})
      .then(data => {


        let currentValues = data.find(a => (a.meta||a.year) == +new Date().getFullYear());

        if(!currentValues)return;

        let total       = 100;
        let targetVal   = currentValues.target || 0;
        let currentVal  = currentValues.value  || 0

        let currentPerc = 100 / (total / currentVal);
        let targetPerc  = 100 / (total / (targetVal-currentVal));

        this.chart.productivityTargets.dataset = [{
          data: [
            currentPerc,
            targetPerc,       // Differenz       (0,4)
            100-currentPerc-targetPerc
          ],
          backgroundColor: [
            '#597a8a',
            '#db6757',
            '#ada79d'
          ],
          hoverOffset: 4
        }]
        this.chart.productivityTargets.options['text'] =  currentValues.value+'%';


        this.chart.productivityTargets.options.plugins['tooltip'] = {
          displayColors: false,
          filter: function (tooltipItem, data) {
            return tooltipItem && tooltipItem.dataIndex < 2
          },
          callbacks: {
            custom: function(tooltip) {
              if (!tooltip) return;
              // disable displaying the color box;
              tooltip.displayColors = false;
            },
            title: function (tooltipItem, data) {
              if(!tooltipItem || !tooltipItem[0])return '';

              if(tooltipItem[0].dataIndex == 1){
                return 'Ziel: ' +  ((targetPerc + currentPerc) ).toFixed(2)+'%'
              }
              else if(tooltipItem[0].dataIndex == 2){
                return ''
              }
              return new Date().getFullYear()+' Produktivität Ø'
            },
            label: function (tooltipItem, data) {
              if(!tooltipItem)return ;

              if(tooltipItem.dataIndex === 1){
                return''
              }
              else if(tooltipItem.dataIndex == 2){
                return ''
              }
              return' '+ (tooltipItem.parsed ).toFixed(2) +'%'
            },
            afterLabel: function (tooltipItem, data) {
              if(!tooltipItem)return ;
              if(tooltipItem.dataIndex === 1){
                return 'Diff: ' +( -(targetPerc.toFixed(2)) )+'%'
              }
              return ''//'(' + currentPerc + '%)';
            }
          }
        }

      })

  }

  // DomHelpers

  getTotalHours(userId,activityId){
    if(this.data[userId] && this.data[userId][activityId]){
        let total = 0;
        for(let year in this.data[userId][activityId]){
          if(this.filterParams.years.length === 0 ||this.filterParams.years.includes(+year))
          for(let month in this.data[userId][activityId][year]){

            if(this.filterParams.months.length === 0 || this.filterParams.months.includes(+month) )
            total += +this.data[userId][activityId][year][month].total
          }
        }
        return total.toFixed(2);

    }else return ' - '
  }

  getTotalPrice(userId,activityId){
    if(this.data[userId] && this.data[userId][activityId]){
        let total = 0;
        for(let year in this.data[userId][activityId]){
          if(this.filterParams.years.length === 0 ||this.filterParams.years.includes(+year))
          for(let month in this.data[userId][activityId][year]){
            if(this.filterParams.months.length === 0 || this.filterParams.months.includes(+month) ){
              total += +this.data[userId][activityId][year][month].value
            }
          }
        }
        return total.toFixed(2) + '.-';
    }else return ' - '
  }

  canShowUser(userId){
    if(!this.filterParams.users['hasEntry'] || this.filterParams.users[userId])
      return true;
  }

  //

  getChartData(){
   this.getUserRevenueChartData()
   this.getBubbleChartData()
    this.getProductivityChartData()
    this.getProductivityBillableSumChartData()
    this.getSumChart()
  }

  getUserRevenueChartData(year = this.chart.users.year){
    this.chart.users.data.datasets = []
    this.productivityAPI.api<any>('chart-users-revenue',{
      year
    })
      .then(data => {
        this.chart.users.data.datasets = data.datasets;
      })
  }

  getProductivityChartData(year= new Date().getFullYear()){
    this.chart.users.data.datasets = []
    this.productivityAPI.api<any>('chart-productivity-monthly',{year})
      .then(data => {
        if(!data)return;
        setTimeout(()=>{
          let index = data.years.findIndex(a => a == year);

          const s1 = data.targets.find(a => a.semester == 'S1') || {};
          const s2 = data.targets.find(a => a.semester == 'S2') || {};

          const annotation1 = {
            type: 'line',

            xScaleID: 'x',
            yScaleID: 'y',

            xMin: 'Jan',
            xMax: 'Jun',

            yMin:  s1.total,
            yMax:  s1.total,
            borderColor: '#db6757',
            borderWidth: 1,
            label: {
              backgroundColor: '#ada79d',
              content: 'S1 ' + s1.total +'%',
              enabled: true
            },
            click: function({chart, element}) {
              console.log('hoi');
            }
          };
          const annotation2 = {
            type: 'line',

            xScaleID: 'x',
            yScaleID: 'y',

            xMin: 'Jul',
            xMax: 'Dez',

            yMin:  s2.total,
            yMax:  s2.total,
            borderColor: '#db6757',
            borderWidth: 1,
            label: {
              backgroundColor: '#ada79d',
              content: 'S2 ' + s2.total +'%',
              enabled: true
            },
            click: function({chart, element}) {
              console.log('hoi');
            }
          };

          const options     = {
            scales: {
              y: {
                suggestedMin: 0,
                  suggestedMax: 80
              },
              x:{
                title: {
                  display: true,
                    text: 'Produktivität in % - ' + new Date().getFullYear()
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

          if(s1.total){
            if(!s2.total){
            delete  annotation1.xMin;
            delete  annotation1.xMax;
            delete  annotation1.xScaleID;
              annotation1.label.content = annotation1.label.content.replace('S1 ','Ziel ')
          }
            options.plugins.annotation.annotations['annotation1'] = annotation1
          }

          if(s2.total){
            if(!s1.total){
              delete  annotation2.xMin;
              delete  annotation2.xMax;
              delete  annotation2.xScaleID;
              annotation2.label.content = annotation2.label.content.replace('S2 ','Ziel ')
            }
            options.plugins.annotation.annotations['annotation2'] = annotation2
          }

          const resultGraphCanvas = <any>document.getElementById('chart-p-by-month')
          new Chart(resultGraphCanvas.getContext("2d"), {
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
              options:options

            });

        },50)
      })
  }

  getProductivityBillableSumChartData(year= new Date().getFullYear()){
    this.chart.users.data.datasets = []
    this.productivityAPI.api<any>('chart-productivity-billable',{year})
      .then(data => {
        if(!data)return;
        setTimeout(()=>{

          const resultGraphCanvas = <any>document.getElementById('chart-billable')
          new Chart(resultGraphCanvas.getContext("2d"),
            {
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
                  {
                    backgroundColor: '#597a8a',
                    data:data.series
                  }
                ]
              },
              options:{
                scales: {
                  y:{
                    beginAtZero: true
                  },
                  x:{
                    title: {
                      display: true,
                      text: 'Verrechenbare Zeit in CHF - '+ new Date().getFullYear()
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
            })

        },50)
      })
  }

  getProductivityUserScoreList(){
    this.productivityAPI.api<any>('list-productivity-users',{})
      .then(data => this.usersScoreBoard = data )
  }

  // Verrechenbar - nicht verrechenbar
  getBubbleChartData(year = this.chart.bubble.year,month= this.chart.bubble.month){
    this.chart.bubble.visible = false
    this.productivityAPI.api<any>('chart-bubble',{
      month:month,
      year:year
    }).then(data => {
      this.chart.bubble.visible = true
      let datasets = [];
      data.forEach(user => {

        let pointStyle = undefined;

        if( user.profileImage){
          const img = new Image();
          img.src  = user.profileImage
          pointStyle = [img,'circle'];
          img.width  = 50
          img.height = 50
        }

        datasets.push({
          label: user.name,
          pointStyle:pointStyle,
          data:   [
            {
              y:  user.billable_total,
              x:  user.total,
              r:20,
            }
          ],
          backgroundColor: 'rgb(255, 99, 132)'
        })
      });
      setTimeout(()=>{
       new Chart(
         (<any>document.getElementById('myChart')).getContext('2d')
         ,  {
           type: 'bubble',
           data: {
             datasets: datasets
           },
           options:{
             scales: {
               yAxes: {
                 title: {
                   display: true,
                   text: 'Verrechenbar',
                   font: {
                     /*size: 15*/
                   }
                 },
               },
               xAxes: {
                 title: {
                   display: true,
                   text: 'N. Verrechenbar',
                   font: {
                     /*size: 15*/
                   }
                 }
               }
             },
           }
         });
     },50)
    })
  }

  onInputChange(){
    this.filterParams.users = {}
    this.filterParams.users['hasEntry'] = 0;
    this.usersEL.nativeElement['choises'].getValue(true).map(v=> {
      this.filterParams.users['hasEntry']++;
      this.filterParams.users[v] = true
    })
  }

  onRangeChange(){
    this.filterParams.years = this.yearsFromEL.nativeElement['choises'].getValue(true).map(v=>+v)
    this.filterParams.months = this.monthFromEl.nativeElement['choises'].getValue(true).map(v=>+v)
    this.filterParams.didChangeRange = true;
    console.log(
      this.filterParams,
      this.yearsFromEL.nativeElement['choises']
    )
  }


}
