import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import { Observable } from "rxjs";
import {environment} from "../../../../environments/environment";
import {Http} from "./http.service";





@Injectable()
export class BaseAPI<Input,Response,FilterOptions> {

  private basePath:string

  constructor(private http: Http) {}

  public register(path){
    this.basePath = path
  }

  private getPath(endPoint:string){
    return this.basePath+'/'+endPoint;
  }

  list(params:FilterOptions = null):Promise<Response[]>{
    return this.http.api(this.getPath('list'),params,'get')
  }
  get(id,params:FilterOptions = <any>{}):Promise<Response>{
    return this.http.api(this.getPath('get'),{...params,id},'get')
  }
  save(param:Input):Promise<number|Response>{
    return this.http.api(this.getPath('save'),{...param},'put')
  }
  update(param:Input):Promise<number|Response>{
    return this.http.api(this.getPath('update'),{...param},'patch')
  }
  updateKey(id,key,value){
    return this.http.api(this.getPath('updateKey'),{id,key,value},'put')
  }
  delete(id:number,params = {}):Promise<boolean>{
    return this.http.api(this.getPath('delete'),{id,...params},'delete')
  }
  api<T>(path,params = {},type:string = 'get'):Promise<T>{
    return this.http.api<T>(this.getPath(path),params,type)
  }

}
