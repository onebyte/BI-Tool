import { Component } from '@angular/core'

@Component({
  selector: 'layout-auth',
  templateUrl: './auth.layout.html',
  styleUrls: ['./auth.layout.scss'],
})
export class LayoutAuthComponent {

  currentYear = new Date().getFullYear()

  constructor() {

  }



  protected openPrivacy(){
    window.open('https://mymovit.com/policy/dsgvo.html', '_blank');
  }
}
