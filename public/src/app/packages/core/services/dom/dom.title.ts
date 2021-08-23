import {EventEmitter,Injectable} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn:'root'
})
export class TitleService {


  public title = '';

  public appTitle = ''

  constructor(private _t:Title, private route:ActivatedRoute){}

  public setTitle(_title:string){
    this.title = _title;
    this.setDocumentTitle(_title)
  }

  public setAppTitle(_title:string){
    this.appTitle = _title;
  }

  public setDocumentTitle(_title){
    document.title = _title + ' BI-TOOL';
  }

}
