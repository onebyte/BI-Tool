import { Component, OnInit } from '@angular/core';
import {BaseAPI} from "../../../../packages/core/services/api.service";

class Entry{
  entryId:number

  companyId:number

  entryType:string = ''

  entrySource:string = ''

  title:string

  date:string

  total:number

  constructor(obj = null) {
    Object.assign(this,obj)
  }
}

@Component({
  selector: 'route-admin-manual-entries',
  templateUrl: './manual-entries.component.html',
  styleUrls: ['./manual-entries.component.scss'],
  providers:[BaseAPI]
})
export class ManualEntriesPage implements OnInit {

  entry:Entry

  data:Entry[]  = [];

  types        = [
    {
      name:'Ergebnisse',
      key:'results'
    },
    {
      name:'Ziele',
      key:'targets'
    },
    /*
    {
      name:'Budget',
      key:'budgets'
    }
    * */
  ]
  years        = {};

  currentYear = new Date().getFullYear()

  constructor(private mEntryAPI: BaseAPI<any,Entry,any>) {
    mEntryAPI.register('administration/manual-entries')
    this.getData()
  }

  ngOnInit() {}

  getData(){
    this.years = {};
    this.mEntryAPI.list()
      .then(data => this.data = data)
      .then(()=>{
        this.years = {};
        this.data.forEach(entry => {
          if(!this.years[entry.entryType])this.years[entry.entryType]=[];
          if(!this.years[entry.entryType].includes(new Date(entry.date).getFullYear()))
            this.years[entry.entryType].push(new Date(entry.date).getFullYear())
        })

      })
  }

  create(){
    this.entry = new Entry()
  }

  edit(entry,clone = false){
    this.entry = new Entry(entry)
    if(clone){
      this.entry.entryId = null
    }
  }

  async save(data){
    if(data.entryId){
      await this.mEntryAPI.update(data)
        .then(()=>  this.entry = null)
    }
    else {
      await this.mEntryAPI.save(data)
        .then(()=>  this.entry = null)
    }

    this.getData()
  }

  delete(id){
    if(confirm('Möchten Sie diesen Eintrag löschen?'))
    this.mEntryAPI.delete(id,{entryType:this.entry.entryType})
      .then(()=> {
        this.entry = null;
        this.getData()
      })
  }

  getTypeName(type){
    switch (type){
      case 'customer':return'K';
      case 'employee':return'MA';
      case 'productivity':return'PR';
      case 'sales':return'V';
      case 'subscriptions':return'ABO';
    }
    if(type.includes('sales'))return 'V';
    return  type;
  }
}
