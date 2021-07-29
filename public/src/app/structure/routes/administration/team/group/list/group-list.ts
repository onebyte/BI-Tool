import {Component, OnInit} from '@angular/core';
import {BaseAPI} from "../../../../../../packages/core/services/api.service";


class Group {
  companyId:number;

  labelId:number;

  type:string;

  users  = []

  constructor(data = null) {
    if(data)Object.assign(this,data);
    if(typeof this.users === 'string'){
      this.users = (<string>this.users).split(',')
    }
  }
}

@Component({
  selector:    'route-admin-group-list',
  templateUrl: 'group-list.html',
  styleUrls:  ['group-list.scss'],
  providers:[BaseAPI]
})

export class GroupListPage implements OnInit{

  users:any[]

  groups:any[]

  group:Group;

  constructor(private groupAPI: BaseAPI<any,any,any>)
  {
    groupAPI.register('administration/group')
    this.getData()
  }

  ngOnInit() {
    // this.ts.setAppTitle('userlist')
   }

  getData(all = true){

    this.groupAPI.list().then(data => this.groups = data);

    if(all){
      this.groupAPI.api<any[]>('users/list').then(users => this.users = users)
    }
  }


  edit(group){
    this.group = new Group(group)

  }
  delete(type){
    if(confirm('Sind Sie sicher, das Sie diese Gruppe löschen möchten?'))
      this.groupAPI.delete(type)
        .then(()=>this.getData(false))
        //.then(()=>this.message());
  }

  save(data){
    this.groupAPI.save(data)
      .then(()=> this.getData(false))
  }

  create(){
    this.group = new Group()
  }

}
