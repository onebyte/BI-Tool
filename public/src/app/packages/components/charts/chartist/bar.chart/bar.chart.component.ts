import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';

import Chartist from 'chartist';
import legend from 'chartist-plugin-legend';

@Component({
  selector: 'comp-chartist-chart-bar',
  templateUrl: './bar.chart.component.html',
  styleUrls: ['./bar.chart.component.scss'],
})
export class BarChartComponent implements OnInit, AfterViewInit {

  @ViewChild('chart') chart:{nativeElement:HTMLElement}
  @Input() title:string           = '';
  @Input() currency:string        = ' ';

  @Input() series:number[]        = [];
  @Input() labels:string[]        = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  @Input() legend:string[]        = [];
  @Input() data:any               = null;
  @Input() dataOptions:any        = null;

  @Input() log                    = false;

  constructor() {

  }

  ngOnInit() {}

  ngAfterViewInit(){

    if(this.data){
      if(!this.data.labels)this.data.labels = this.labels;

      if(this.dataOptions){
        this.dataOptions.plugins = [
          Chartist.plugins.tooltip({currency: this.currency ||' '}),
          Chartist.plugins.tooltip()
        ]
      }

      return new Chartist.Bar(this.chart.nativeElement, this.data, this.dataOptions || {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: ''
            }
          }
        });
    }

    // OVERLAPPING BAR
    var overlappingData = {
        labels: this.labels,
        series: this.series,
      },
      overlappingOptions = {
        //seriesBarDistance: 10,
        plugins: [
          Chartist.plugins.tooltip({currency: this.currency ||' '}),
          legend({legendNames:this.legend})
        ],
      },
      overlappingResponsiveOptions = [
        [
          '',
          {
            seriesBarDistance: 5,
            axisX: {
              labelInterpolationFnc: function (value) {
                return value[0]
              },
            },
          },
        ],
      ];

    let chart = new Chartist.Bar(
      this.chart.nativeElement,
      overlappingData,
      overlappingOptions,
      //overlappingResponsiveOptions,
    );

    if(this.log){
      console.log(
        overlappingData,
        overlappingOptions,
      )
    }

  }
}
