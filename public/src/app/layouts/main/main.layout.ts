import { Component, OnInit } from '@angular/core'

import { slideFadeinUp, slideFadeinRight, zoomFadein, fadein } from '../../structure/routing/router-animations'

@Component({
  selector:    'layout-main',
  templateUrl:  './main.layout.html',
  styleUrls:   ['./main.layout.scss'],
  animations:  [slideFadeinUp, slideFadeinRight, zoomFadein, fadein],
})
export class LayoutMainComponent implements OnInit {

  constructor() {}

  ngOnInit() {
    setTimeout(()=>{
      let user = JSON.parse(localStorage.getItem('user'))
      window['beamer_config'] = {
        button_position: 'bottom-left',
        product_id : 'lJOtDlpd36219',
        user_firstname : user.firstName,
        user_lastname : user.lastName,
        user_email : user.email,
        language: 'DE',
      };
      let getbeamerJS = document.createElement("script");
      getbeamerJS.setAttribute(
        "src",
        "https://app.getbeamer.com/js/beamer-embed.js");
      document.body.appendChild(getbeamerJS);
    },500)
  }

  public getRouterOutletState(outlet) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }

}
