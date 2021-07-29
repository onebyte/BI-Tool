import {AfterContentInit, AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';

import Chartist from 'chartist';
import ChartistTooltip from 'chartist-plugin-tooltips-updated';


@Component({
  selector: 'comp-mini-chart-with-text',
  templateUrl: './mini.chart.with-text.component.html',
  styleUrls: ['./mini.chart.with-text.component.scss'],
})
export class MiniChartWithTextComponent implements OnInit, AfterViewInit {

  @ViewChild('chart') chart:{nativeElement:HTMLElement}

  @Input() data = []

  @Input() title:string        = '';
  @Input() currency:string     = ' ';

  @Input() total:string|number = '';

  @Input() showChart:boolean       = true;
  @Input() textUppercase:boolean   = false;


  constructor() {}

  setId(){
    this.chart.nativeElement.id = (+new Date()).toString()
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.setId();
    this.initChart()
  }

  initChart(){
    if(!this.showChart)return
    let chart = new Chartist.Line(
      this.chart.nativeElement, {
        series: [
          {
            className: 'ct-series-a',
            data:this.data,
          },
        ],
      },
      {
        width: '120px',
        height: '107px',

        showPoint: true,
        showLine: true,
        showArea: true,
        fullWidth: true,
        showLabel: false,
        axisX: {
          showGrid: false,
          showLabel: false,
          offset: 0,
        },
        axisY: {
          showGrid: false,
          showLabel: false,
          offset: 0,
        },
        chartPadding: 0,
        low: 0,
        plugins: [ ChartistTooltip({
          currency: this.currency,
          pointClass: 'ct-area-animated',
          appendToBody: true,
        })],
      },
    )
    // https://jsfiddle.net/9gzqnrd8/9/
    chart.on('draw', function(data) {

      // If the draw event was triggered from drawing a point on the line chart
      if(data.type === 'point') {
        // We are creating a new path SVG element that draws a triangle around the point coordinates

        var circle = new Chartist.Svg('circle', {
          cx: [data.x],
          cy: [data.y],
          r: [4],
          'ct:value': data.value.y, // VERY IMPORTANT
          'ct:meta': data.meta, // VERY IMPORTANT
          style: 'pointer-events: all !important', // VERY IMPORTANT
          class: 'ct-area-animated',
        }, 'ct-area');

        // With data.element we get the Chartist SVG wrapper and we can replace the original point drawn by Chartist with our newly created triangle
        data.element.replace(circle);
      }
    });
  }
}
