import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BarChartComponent} from "./chartist/bar.chart/bar.chart.component";
import {MiniChartWithTextComponent} from "./chartist/mini.chart.with-text/mini.chart.with-text.component";
import {DynamicChartComponent} from "./chartjs/dynamic.chart/dynamic.chart.component";

const COMPONENTS = [
  MiniChartWithTextComponent,
  BarChartComponent,

  DynamicChartComponent
]

@NgModule({
  declarations: COMPONENTS,
  exports:COMPONENTS,
  imports: [
    CommonModule
  ],

})
export class SharedChartsModule { }
