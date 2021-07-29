import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../../../../packages/core/auth/auth.service";
import {BaseAPI} from "../../../../../packages/core/services/api.service";

class User{
  userId:number;

  companyId:number;
}

interface IUserResponse{
  data:User
}

@Component({
  selector:    'route-admin-user-list',
  templateUrl: 'user-list.html',
  styleUrls:  ['user-list.scss'],
})

export class UserListPage  implements OnInit{

  users = [];

  user:User = null;


  constructor(
    private auth:    AuthService,
    private userAPI: BaseAPI<User,IUserResponse,any>
   )
  {
    userAPI.register('administration/user')
    this.getData()
  }

  ngOnInit() {
    // this.ts.setAppTitle('userlist')
   }

  getData() {
     this.getUsers()
   }

  getUsers(){
    this.userAPI.list().then(data => {
      this.users = data
    })
     /**
      this.userAPI.Administration(this.pathName).get.Users()
      .then((data:any)=>{
         this.users = data.filter(i=>!i.fromBranch)
         this.usersFromOtherBranches = data.filter(i=>i.fromBranch)
       })
      * */
   }

  getUserData(id){
    this.getAllowedApps(id);
    this.getUserSettings(id);

   }

  getAllowedApps(id){
   /**
    this.appsAPI.Administration('user/'+this.pathName).get.Apps({userId:id})
    .then((data:any)=>{
        this.user.appList = data
      })
    * */
  }

  getUserSettings(id){
    /*
      this.userAPI.Administration(this.pathName).get.UserSettings(id)
      .then((data:any)=>{
        this.user.settings = {lang:{}}
        if(data.main.lang_mod){
          this.user.settings.lang = JSON.parse(data.main.lang_mod )
        }

      })
    * */
  }

  updateUserKey(id,key,value){
    this.userAPI.updateKey(id, key, value)
  }

  createUser(){
    this.setUser({})
  }

  setUser(usr){
    this.user = null
     this.user = usr
     if(usr&& this.user.userId)
      this.getUserData(this.user.userId)
   }

  updateUser(user){
   if(!user.userId){
       this.userAPI.save(user)
           .then(data=>{
               this.setUser(null);
               this.getData()
           })
   }   else
    this.userAPI.update(user)
      .then(data=>{this.setUser(null);})
   }

  updatePasswort(pw,user){

   }

  countAllowedApps(appsString){
      if(!appsString)return 0
        else if(typeof appsString === 'string') return  appsString.split(',').length
    }

  getAllowedAppsLabel(appsString){
        if(!appsString)return ''
        let str = ''
        appsString.split(',').map(v=>{
            str+= v.split('_')[0]+'\n'
        })
        return str;
    }

  }
