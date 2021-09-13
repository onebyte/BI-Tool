import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../../../../packages/core/auth/auth.service";
import {BaseAPI} from "../../../../../packages/core/services/api.service";


class Role{
  roleId:any

  companyId:any

  loginFrom:any

  loginTill:any

  roleEnabled:boolean

  name:string

  type:'domain'|'group'|'global'

  apps?:any[] = [];

  users?:any[] = [];

  constructor(r = null) {
    if(r)Object.assign(this,r)
  }

  setApps(a){
    this.apps = a
  }
  setUsers(u){
    this.users = u;
  }
}
class IRoleResponse extends Role{

}

@Component({
  selector:    'route-admin-user-roles',
  templateUrl:   'user-roles.html',
  styleUrls:    ['user-roles.scss'],
})
export class UserRolesPage implements OnInit{

  pathName = 'role';

  roles = [];

  users = [];
  apps = [];

  role  = null;

  constructor
  (
    private auth:        AuthService  ,
    private roleAPI: BaseAPI<Role,IRoleResponse,any>
  ){
    roleAPI.register('administration/role');
    this.getData();

  }

  ngOnInit() {

  }

  getData(all = true){
    this.users = [];
    this.apps = [];
    this.roleAPI.list().then(data => this.roles = data.map(role => {
        if(typeof role.apps === 'string')role.apps   = (<any>role.apps).split(',')
        if(typeof role.users === 'string')role.users = (<any>role.users).split(',')
        return role
      }));
    if(all){
      this.getUsersAndApps()
     }
   }

   getUsersAndApps(){
     this.roleAPI.api<any[]>('users/list').then(users => this.users = users)
     this.roleAPI.api<any[]>('apps/list').then(apps => this.apps = apps)
   }

  createRole(type='u'){
    this.setUserRole({
      apps:[],
      users:[]
    })

  }

  editRole(role){
    if(role && role.roleId){
     this.roleAPI.get(role.roleId)
        .then(async( data)=> {
          if(this.users.length === 0) await this.getUsersAndApps()

          const result :{
              role: Role,
              apps: {appId:number,access:string}[],
              users:number[],
          }= <any>data
          this.role = new Role(result.role)
          this.role.setUsers(result.users)
          this.role.setApps(result.apps);


        })
    }

  }

  setUserRole(r){
    this.role = new Role(r);
  }

   saveRole(role) {
    this.roleAPI.save(role)
      .then(()=>this.roles = [])
      .then(()=>this.getData(true))
      .then(()=>this.updateMenu()).then(()=>this.message())
  }

  deleteRole(rId){
    if(confirm('Sind Sie sicher, das Sie diese Rolle löschen möchten?'))
    this.roleAPI.delete(rId)
      .then(()=>this.getData(false)).then(()=>this.updateMenu()).then(()=>this.message());

  }

  updateMenu(){
    setTimeout(()=>window['updateMenu'](),2000)
  }

  message(){

  }
}
