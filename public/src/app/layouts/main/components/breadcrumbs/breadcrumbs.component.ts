import { Component } from '@angular/core'
import { Router, NavigationStart, ActivatedRoute } from '@angular/router'

import { filter } from 'rxjs/operators'
import { reduce } from 'lodash'
import {TitleService} from "../../../../packages/core/services/dom/dom.title";


@Component({
  selector:    'lay-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: [ './breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent {

  simple = true

  constructor(public ts: TitleService, route:ActivatedRoute)
  {

  }

  ngOnInit() {

  }


}
