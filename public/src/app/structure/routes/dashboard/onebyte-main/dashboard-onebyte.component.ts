import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Chart from 'chart.js/auto';
import {BaseAPI} from "../../../../packages/core/services/api.service";
import {TitleService} from "../../../../packages/core/services/dom/dom.title";



@Component({
  selector: 'dashboard-onebyte',
  templateUrl: './dashboard-onebyte.component.html',
  styleUrls: ['./dashboard-onebyte.component.scss'],
  providers:[BaseAPI]
})
export class DashboardOnebyteComponent implements OnInit {

  chart = {
    revenue:        {
      labels:[],
      series:[]
    },
    revenueYear:        {
      data:null,
      dataOptions:null,
    },
    productivity:   {
      labels:[],
      series:[]
    },

    revenueSum:     {
      data:[],
      total:0
    },
    productivitySum:{
      data:[],
      total:0
    },

    employee: {
      labels:[],
      series:[]
    },
    customer: {
      labels:[],
      series:[]
    },
    subscription:{
      labels:[],
      series:[]
    },

    revenueTargets:{
      type:'doughnut',
      dataset:[],
      options:{cutout:'80%',plugins:{},text:'',subText:'' }
    },
    productivityTargets:{
      type:'doughnut',
      dataset:[],
      options:{cutout:'80%',plugins:{},text:'' }
    },
    employeeTargets:{
      type:'doughnut',
      dataset:[],
      options:{cutout:'80%',plugins:{},text:''  }
    },
    customerTargets:{
      type:'doughnut',
      dataset:[],
      options:{cutout:'80%',plugins:{},text:''  }
    },
    subscriptionTargets:{
      type:'doughnut',
      dataset:[],
      options:{cutout:'80%',plugins:{},text:''  }
    }
  }

  cYear = new Date().getFullYear()

  constructor(
    private api:BaseAPI<any, any, any>,
    private ts:TitleService,
  ){
    api.register('dashboard/main');
    this.getData()
  }

  getData(){
    Promise.all([
      this.api.api('chart-revenue').then((data:any) => {
        this.chart.revenue.labels = data.years;
        this.chart.revenue.series = data.series;
      }).then(()=>this.updateView()),
      this.api.api('chart-revenue-quartal',{year:new Date().getFullYear()}).then((data:any) => {
        this.chart.revenueYear.data = {
          labels:  ['Q1', 'Q2', 'Q3', 'Q4'],
          series: data.series
        }
        this.chart.revenueYear.dataOptions ={
          seriesBarDistance: 15,
         }
        if(localStorage.getItem('debug'))console.log(data)
      }),
      this.api.api('chart-productivity').then((data:any) => {
      this.chart.productivity.labels = data.years;
      this.chart.productivity.series = data.series;
    }).then(()=>this.updateView()),
      this.api.api('chart-manual-entry',{entrySource:"employee"}).then((data:any) => {
        this.chart.employee.labels = data.years;
        this.chart.employee.series = data.series;
      }).then(()=>this.updateView()),
      this.api.api('chart-manual-entry',{entrySource:"customer"}).then((data:any) => {
        this.chart.customer.labels = data.years;
        this.chart.customer.series = data.series;
      }).then(()=>this.updateView()),


      /* Summary by year */
      this.api.api<any[]>('chart-revenue-sum',{byYear:true,max:5})
      .then(data => {

        let lastValues    = data.find(a => (a.meta||a.year) == (new Date().getFullYear()-1));
        let currentValues = data.find(a => (a.meta||a.year) == +new Date().getFullYear());

       //https://stackoverflow.com/questions/52044013/chartjs-datalabels-show-percentage-value-in-pie-piece
       //tooltip: https://stackoverflow.com/questions/43604597/how-to-customize-the-tooltip-of-a-chart-js-2-0-doughnut-chart
       //https://codesandbox.io/s/chart-js-playground-7br74?file=/src/index.ts

       const currentDayOfYear = (()=>{
          var now  = <any>new Date();
          var start = <any>new Date(now.getFullYear(), 0, 0);
          var diff = now - start;
          var oneDay = 1000 * 60 * 60 * 24;
          return  Math.floor(diff / oneDay);
        });

       /*
        * Prozent des Jahres sind bereits vergangen.
        * */
       const targetPerc = Math.floor( 100 / (365 / currentDayOfYear()));

       /* Ziel zum erreichen */
       let targetVal    = currentValues.target || 0;

       /* Wert Heute */
       let currentVal    = currentValues.value  || 0;

       /* Differenz zwischen Ziel und heute */
       const currentPerc = targetPerc / (targetVal / currentVal);

       this.chart.revenueTargets.dataset = [{
          data:  [
            currentPerc,
            targetPerc-currentPerc,
            100 -  targetPerc
          ],
          backgroundColor: [
            '#597a8a',
            ( currentVal-targetVal < 0 ? '#db6757' : '#98b0bc'),
            '#ada79d'
          ],
          hoverOffset: 4
        }]

        this.chart.revenueTargets.options.plugins['tooltip'] = {
          callbacks: {
            title: function (tooltipItem, data) {
                switch (tooltipItem[0].dataIndex??tooltipItem.dataIndex){
                  case 0: return 'Wert';
                  case 1: return 'Ziel';
                  case 2: return '';
                }
              },
            label: function (tooltipItem, data) {

              if(tooltipItem.dataIndex === 0)
              {
                return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'CHF' }).format(currentVal);
              }

              if(tooltipItem.dataIndex === 1)
              {
                return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'CHF' }).format(targetVal);
              }

              if(tooltipItem.dataIndex === 2)
              {
                return 'Resttage: '+ (365 - currentDayOfYear())
              }
            },
            afterLabel: function (tooltipItem, data) {
              if(tooltipItem.dataIndex === 1){
               return ' Diff: '+ (
                 new Intl.NumberFormat('de-DE' ).format(currentVal-targetVal)
               )
              }
              if(tooltipItem.dataIndex === 2)
              {
                return '';
              }
              return;
            }
          }
        }

        this.chart.revenueTargets.options['text'] = new Intl.NumberFormat('de-DE' ).format(currentVal) +' CHF';

        //if(lastValues) this.chart.revenueTargets.options['subText'] = new Intl.NumberFormat('de-DE' ).format(   currentVal - lastValues.value ) +' CHF <br> Letztes Jahr ';

        function numberWithCommas(x) {
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        this.chart.revenueSum.data = data.map(v => {
          return {
            value:+(v.value || v.total || 0).toFixed(2),
            meta:(v.meta || v.year)+''
          }
        });
        if( data[data.length-1]) this.chart.revenueSum.total  = numberWithCommas(+((data[data.length-1].total || data[data.length-1].value)).toFixed(2));

      }),

      this.api.api<any[]>('chart-productivity-sum',{byYear:true,max:5})
      .then(data => {


        let currentValues = data.find(a => (a.meta||a.year) == +new Date().getFullYear());

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

        function numberWithCommas(x) {
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        this.chart.productivitySum.data = data.map(v => {
          let value = 0;
          try {
            value = (v.value || v.total || v.perc || '0').toFixed(2)
          }catch (e){}


          return {
            value:+value,
            meta:(v.meta || v.year)+''
          }
        });
        if( data[data.length-1]) this.chart.productivitySum.total  = numberWithCommas(+(data[data.length-1].total || data[data.length-1].value));

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
              return 'Wert'
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

      }),


      this.api.api<any[]>('chart-employee-sum',{byYear:true,max:5})
        .then(data => {

          let currentValues = data.find(a => (a.meta||a.year) == +new Date().getFullYear());
          if(!currentValues)return;

          let total       = 10;
          let targetVal   = currentValues.target || 0;
          let currentVal  = currentValues.value  || 0

          let currentPerc = 100 / (total / currentVal);
          let targetPerc  = 100 / (total / (targetVal-currentVal));

          this.chart.employeeTargets.dataset = [{
            data: [
              currentPerc,
              targetPerc,       // Differenz       (0,4)
              100-currentPerc-targetPerc
            ],
            backgroundColor: [
              '#597a8a',
              targetPerc<0 ? '#98b0bc' :'#db6757',
              '#ada79d'
            ],
            hoverOffset: 4
          }];
          this.chart.employeeTargets.options['text'] =  currentValues.value+'%';
          this.chart.employeeTargets.options.plugins['tooltip'] = {
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
                  return 'Ziel: ' +  ((targetPerc + currentPerc) / 10).toFixed(2)+'%'
                }
                else if(tooltipItem[0].dataIndex == 2){
                  return ''
                }
                return 'Wert'
              },
              label: function (tooltipItem, data) {
                if(!tooltipItem)return ;

                if(tooltipItem.dataIndex === 1){
                  return''
                }
                else if(tooltipItem.dataIndex == 2){
                  return ''
                }
                return' '+ (tooltipItem.parsed / 10).toFixed(2) +'%'
              },
              afterLabel: function (tooltipItem, data) {
                if(!tooltipItem)return ;
                if(tooltipItem.dataIndex === 1){
                  return 'Diff: ' +( -((targetPerc/10).toFixed(2)) )+'%'
                }
                return ''//'(' + currentPerc + '%)';
              }
            }
          }

        }),


      this.api.api<any[]>('chart-customer-sum',{byYear:true,max:5})
        .then(data => {

          let currentValues = data.find(a => (a.meta||a.year) == +new Date().getFullYear());

          if(!currentValues)return

          let total       = 10;
          let targetVal   = currentValues.target || 0;
          let currentVal  = currentValues.value  || 0

          let currentPerc = 100 / (total / currentVal);
          let targetPerc  = 100 / (total / (targetVal-currentVal));

          this.chart.customerTargets.dataset = [{
            data: [
              currentPerc,
              targetPerc,       // Differenz       (0,4)
              100-currentPerc-targetPerc
            ],
            backgroundColor: [
              '#597a8a',
              targetPerc<0 ? '#98b0bc' :'#db6757',
              '#ada79d'
            ],
            hoverOffset: 4
          }];
          this.chart.customerTargets.options['text'] = (currentValues.value || 0).toFixed(2)+'%';
          this.chart.customerTargets.options.plugins['tooltip'] = {
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
                  return 'Ziel: ' +  ((targetPerc + currentPerc) / 10).toFixed(2)+'%'
                }
                else if(tooltipItem[0].dataIndex == 2){
                  return ''
                }
                return 'Wert'
              },
              label: function (tooltipItem, data) {
                if(!tooltipItem)return ;

                if(tooltipItem.dataIndex === 1){
                  return''
                }
                else if(tooltipItem.dataIndex == 2){
                  return ''
                }
                return' '+ (tooltipItem.parsed / 10).toFixed(2) +'%'
              },
              afterLabel: function (tooltipItem, data) {
                if(!tooltipItem)return ;
                if(tooltipItem.dataIndex === 1){
                  return 'Diff: ' +( -((targetPerc/10).toFixed(2)) )+'%'
                }
                return ''//'(' + currentPerc + '%)';
              }
            }
          }

        }),


      this.api.api<any[]>('chart-subscription-sum',{byYear:true,max:5})
        .then(data => {

          let currentValues = data.find(a => (a.meta||a.year) == +new Date().getFullYear());

          if(!currentValues)return;

          const currentDayOfYear = (()=>{
            var now  = <any>new Date();
            var start = <any>new Date(now.getFullYear(), 0, 0);
            var diff = now - start;
            var oneDay = 1000 * 60 * 60 * 24;
            return  Math.floor(diff / oneDay);
          });
          const targetPerc = Math.floor( 100 / (365 / currentDayOfYear()));

          let targetVal   = currentValues.target || 0;
          let currentVal  = currentValues.value  || 0;

          const currentPerc = targetPerc / (targetVal / currentVal);


          this.chart.subscriptionTargets.dataset = [{
            data: [
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
                  case 1: return 'Ziel: ' + targetVal;
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
                return 'Resttage: '+ (365 - currentDayOfYear());
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
        }),

      this.api.api<any[]>('chart-subscriptions-grouped',{year:new Date().getFullYear()})
        .then((data:any) => {

          this.chart.subscription.series = data.series
          this.chart.subscription.labels = data.labels


        })


    ]).then(()=>this.updateView())
  }

  ngOnInit() {}

  updateView(){
    setTimeout(()=>{
      window.dispatchEvent(new Event('resize'))
    },500);
  }
}
