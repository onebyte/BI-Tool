import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {StoreUser} from "../../../../../packages/core/store/store.user";
import {AuthService} from "../../../../../packages/core/auth/auth.service";
import {BaseAPI} from "../../../../../packages/core/services/api.service";
import { Router } from "@angular/router";
import {TitleService} from "../../../../../packages/core/services/dom/dom.title";
import {CheckForUpdateService} from "../../../../../packages/services/serviceworker.service";

interface Apps{

  title:string,
  base: string,
  img:'',
  children:Apps[],
  appId:number,
  catId?:number
}

@Component({
  selector:    'lay-comp-menu-top',
  templateUrl: './menu-top.component.html',
  styleUrls: [ './menu-top.component.scss'],
  providers:[BaseAPI]
})
export class MenuTopComponent implements OnInit,OnDestroy {

  menu:Apps[] = []

  showSubMenu = true;

  sortOder = [
    1,12,5,3
  ]

  constructor(
    public menuAPI:BaseAPI<Apps, any, any>,
    public userStore:StoreUser,
    public router:Router,
    private auth:AuthService,
    private ts:TitleService,
    public pwa:CheckForUpdateService,
    ) {
    this.menuAPI.register('apps')
     this.getData()

  }

  getData(){
    this.menuAPI.list().then(rows => this.menu = rows
      .sort((a,b)=> this.sortOder.indexOf(a.catId) - this.sortOder.indexOf(b.catId)))
      .then(()=> {
        setTimeout(()=>{
          if(sessionStorage.getItem('app.menu.auto-navigate') &&
            this.menu[0].children.find(child => (child.appId||child['id']) ==1.01)){
            this.router.navigate(['/dashboard/onebyte/main']);
            sessionStorage.removeItem('app.menu.auto-navigate')
          }
        },50)
      })

  }

  ngOnInit() {
    window['updateMenu'] = ()=> this.getData()
  }

  ngOnDestroy() {

  }

  updateTime(){

  }

  onToggle(e:any){

  }

  signOf(){
    this.auth.signOut()
  }

  navigateTo(title,path,$event){
    if($event.ctrlKey)return;
    $event.preventDefault();
    this.setMenuTitle(title)
    this.showSubMenu = false;
    this.router.navigate([path]);
    setTimeout(()=>this.showSubMenu = true,10)
  }

  setMenuTitle(title){
    this.ts.setAppTitle(title)
  }
}
