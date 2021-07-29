import { Component, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'

import { slideFadeinUp, slideFadeinRight, zoomFadein, fadein } from '../../structure/routing/router-animations'

import Chartist from 'chartist';

@Component({
  selector:    'layout-main',
  templateUrl:  './main.layout.html',
  styleUrls:   ['./main.layout.scss'],
  animations:  [slideFadeinUp, slideFadeinRight, zoomFadein, fadein],
})
export class LayoutMainComponent implements OnInit {

  constructor() {

  }

  ngOnInit() {


  }

  public getRouterOutletState(outlet) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }

}
