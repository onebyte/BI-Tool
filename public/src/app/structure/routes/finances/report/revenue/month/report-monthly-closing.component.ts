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

const currencyFractionDigits = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'CHF',
}).resolvedOptions().maximumFractionDigits;

const NumberFormat= (number) =>
   (number).toLocaleString('de-DE', { maximumFractionDigits: currencyFractionDigits });


@Component({
  selector:     'app-report-revenue-monthly',
  templateUrl:  './report-monthly-closing.component.html',
  styleUrls: [  './report-monthly-closing.component.scss'],
  providers:[BaseAPI]
})
export class FinancesReportRevenueMonthlyClosingComponent implements OnInit {

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

  /*Perfomance helper*/
  caching = {

  }


  constructor(private reportAPI:BaseAPI<any, IList, any>) {
    this.reportAPI.register('finances/report/revenue');
    this.getData()
  }

  async getData(){
    this.caching = {}

  }


  ngOnInit() {}


}
