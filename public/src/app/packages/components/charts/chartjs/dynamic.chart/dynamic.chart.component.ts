import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';

import Chart from 'chart.js/auto'

@Component({
  selector: 'comp-chartjs-chart',
  templateUrl: './dynamic.chart.component.html',
  styleUrls: ['./dynamic.chart.component.scss'],
})
export class DynamicChartComponent implements OnInit, AfterViewInit {

  @ViewChild('chart') chart:{nativeElement:HTMLCanvasElement}
  @Input() title:string           = '';
  @Input() titleInner:string      = '';
  @Input() titleAlignment:string  = '';
  @Input() height:number          = 300;

  @Input() type:any       = 'bar';
  @Input() data:any          = null;
  @Input() options:any       = null;

  id = 'chart_'+this.type+'_'+(+new Date())

  constructor() {

  }

  ngOnInit() {}

  ngAfterViewInit(){

    if(!this.data.labels)
      this.data.labels  = [
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

    let options = this.options
    let id = this.id;

    if(this.type === 'polarArea'){
      console.log('polarArea',
        this.data,this.options)
    }


   new Chart(
      this.chart.nativeElement.getContext('2d'),
      {
        type: this.type,
        data: this.data,
        options: this.options || {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: ''
            },
            test:{
              beforeDraw: function(chart) {
                if(!options.text)return;

                var width = chart.width, height = chart.height, ctx = chart.ctx;
                ctx.restore();

                var fontSize = (height / (chart.canvas.height/3)).toFixed(2);
                ctx.font = fontSize + "em sans-serif";
                ctx.textBaseline = "middle";

                var text =  options.text.main,
                  textX  = Math.round((width - ctx.measureText(text).width) / 2),
                  textY  = (height+15) / 2;

                ctx.fillText(text, textX, textY);
                ctx.save();
              }
            }
          },
        }
      });


  }
}
