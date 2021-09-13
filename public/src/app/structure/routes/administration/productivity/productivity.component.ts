import { Component, OnInit } from '@angular/core';
import {BaseAPI} from "../../../../packages/core/services/api.service";

@Component({
  selector:    'app-productivity',
  templateUrl: './productivity.component.html',
  styleUrls:  ['./productivity.component.scss'],
  providers:[BaseAPI]
})
export class ProductivitySettingsComponent implements OnInit {

  activites = []

  constructor(
    private api: BaseAPI<any,any,any>

  ) {
    api.register('administration/productivity')
    this.getData()
  }

  ngOnInit() {}

  getData(){
    this.api.list()
      .then((data)=> this.activites = data.sort(((a, b) => +a.code - +b.code)))
  }

  updateProdLevelValue(id,value){
    return this.api.api('updateProdLevel',
      {
        id,value
      },'post')
      .then(()=>this.getData())
  }

  getBgColor(level){
    if(level == 1)return '#4caf50'
    if(level == -1)return '#f44336'
    if(level == 0)return '#ffeb3b'
  }
}
