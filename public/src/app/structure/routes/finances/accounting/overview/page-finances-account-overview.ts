import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {BaseAPI} from "../../../../../packages/core/services/api.service";
import {Helper} from "../../../../../packages/classes/helper/helper.table.class";
import Table = Helper.Table;

class Account{

  code

  constructor(data = {}) {
    Object.assign(this,data)
  }
}

@Component({
  selector:    'page-accounts-overview',
  templateUrl: './page-finances-account-overview.html',
  styleUrls:   ['./page-finances-account-overview.scss'],
  providers: [ BaseAPI  ],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class FinancesAccountOverviewPage  implements OnInit {

  table = new Table<Account>( [
    {
      width:'8%',
      name:  'Code',
      key:   'code',
      type:  '',
      filter:false,
      sort:  true,
    },
    {
      name:  'Beschreibung',
      type:  '',
      key:  'name',
      filter:false,
      sort:  true,
    },
    {
      name:  'FiBu KAt.',
      key:   'categoryName',
      type:  '',
      filter:false,
      sort:  true,
    },
    {
      width:'8%',
      name:  'Typ',
      key:   'type',
      type:  '',
      filter:false,
      sort:  true,
      render(x){
        switch (x){
          case 'active': return 'Aktiven'
          case 'passive':return 'Passiven'
          case 'revenue':return 'Umsatz'
          case 'expense':return 'Aufwand'
          default : return x
        }
      }
    },
    {
      width:'8%',
      name:  'Source',
      key:   'externType',
      type:  '',
      filter:false,
      sort:  true,

    }
  ])

  lists = [
    {
      name:'Umlaufvermögen',
      codeFrom:0,
      codeTill:1399,
    },
    {
      name:'Anlagevermögen',
      codeFrom:1400,
      codeTill:1999,
    },
    {
      name:'Kurzfristiges Fremdkapital',
      codeFrom:2000,
      codeTill:2399,
    } ,
    {
      name:'Langfristiges Fremdkapital',
      codeFrom:2400,
      codeTill:2999,
    },
    {
      name:'ER',
      codeFrom:3000,
      codeTill:9999,
    }
  ]

  tab   = ''

  accounts:Account[]     = []

  loading = true;


  constructor(
    private cdr:ChangeDetectorRef,
    private accountAPI:BaseAPI<Account, Account, any>
  )
  {
    this.accountAPI.register('finances/accounts');
    this.getData()
  }

  async ngOnInit() {

  }

  getData() {

    this.getAccounts()
  }

  getAccounts(){
    this.loading = true
    this.accountAPI.list()
      .then((data:any)=> this.accounts = data.map(d=>new Account(d)))
      .then((d)=>this.loading = false)
      .then(()=>this.updateView())

  }



  canShowCode(codeNr,from,till){
    return codeNr>= from && codeNr<= till
  }

  updateView(){
    this.cdr.detectChanges()
  }


}
