import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {StoreUser} from "../../../../../packages/core/store/store.user";
import {AuthService} from "../../../../../packages/core/auth/auth.service";
import {BaseAPI} from "../../../../../packages/core/services/api.service";
import { Router } from "@angular/router";
import {TitleService} from "../../../../../packages/core/services/dom/dom.title";

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

  showSubMenu = true

  constructor(
    public menuAPI:BaseAPI<Apps, any, any>,
    public userStore:StoreUser,
    public router:Router,
    private auth:AuthService,
    private ts:TitleService,
    ) {
    this.menuAPI.register('apps')
     this.getData()

  }

  getData(){
    this.menuAPI.list().then(rows => this.menu = rows)
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

  navigateTo(title,path){
    this.setMenuTitle(title)
    this.showSubMenu = false;
    this.router.navigate([path]);
    setTimeout(()=>this.showSubMenu = true,10)
  }

  setMenuTitle(title){
    this.ts.setAppTitle(title)
  }
}
