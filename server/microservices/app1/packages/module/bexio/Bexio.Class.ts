// import the module
import Bexio1  from "bexio";

import BaseCrud from "bexio/lib/resources/BaseCrud";

import * as moment from "moment";

import {Finances} from "../../models/finances/Account";
import Account = Finances.Account;
import AccountCategory = Finances.AccountCategory;

import {AuthUser} from "../../../../core/packages/models/User.Model";
import Database from "../../../../core/packages/database/Connection";
import {cryptoUtils} from "../../../../core/packages/utils/crypto/crypto.utils";
import {Company} from "../../../../core/packages/models/Company.Model";

const randomToken   = (len) => new Promise(resolve => require('crypto').randomBytes(len, function (err, buffer) {
    resolve(buffer.toString('hex'))
}));

const cloneInstance = (bexio) => Object.assign(Object.create(Object.getPrototypeOf(bexio.users)), bexio.users)

export namespace BexioHelper{

    export class Bexio{

        // loaded company
        public companyId: number = null;

        public bexioApi:Bexio1;

        readonly company:BexioCompany           = new BexioCompany(this);
        readonly accounts:BexioAccounts         = new BexioAccounts(this);
        readonly users:BexioUsers               = new BexioUsers(this);
        readonly timeTracking:BexioTimeTracking = new BexioTimeTracking(this);
        readonly reporting:BexioReporting       = new BexioReporting(this);
        readonly orders:BexioOrders             = new BexioOrders(this);

        constructor(token:string) {
            this.bexioApi = new Bexio1(token)
        }

        public getCustomAPI(): BaseCrud<any, any, any, any, any, any> {
            return cloneInstance(this.bexioApi)
        }

    }

    class BexioCompany{

        constructor(protected bexio:Bexio) {}

        public async findCompany(idx = 0){
            const api = this.getCustomAPI();

            api['apiEndpoint'] = '/company_profile'
            api['baseApiUrl'] = 'https://api.bexio.com/2.0';

            const bexioCompanies = await api.list();
            const bexioEntry     = bexioCompanies[idx];
            if (!bexioEntry) return null;
            const company        = new Company.Model()
            let dbCompany        = await company.find(bexioEntry.id, 'externId');

            this.bexio.companyId = dbCompany.getId();

            return this.bexio.companyId;

        }

        public getCompanyActivities(){
            return  this.bexio.bexioApi.businessActivities.list()
        }

        public importCompanyActivities(){
            console.log('importCompanyActivities')
            return this.getCompanyActivities()
                .then(async activities => {
                    for(let i = 0;i<activities.length;i++){
                        const ay          = activities[i];
                        const {accountId} = await Account.getAccountByExternId(ay.account_id,'BEXIO', this.bexio.companyId) || {}
                        const activity = await Company.Activity.getActivityByExternId(ay.id,'BEXIO' ,this.bexio.companyId)

                        if(!accountId){
                            console.error('importCompanyActivities:','accountId not found',ay.account_id)
                            continue;
                        }

                        const code = ay.name.split(' ')[0]
                        await new Company.Activity({
                                activityId:     activity ? activity.activityId:undefined,
                                externType:'BEXIO',
                                externId:       ay.id,
                                companyId:      this.bexio.companyId,
                                title:          ay.name,
                                accountId:      accountId,
                                billable:       ay.default_is_billable,
                                pricePerHour:   ay.default_price_per_hour,
                                code:           code,
                            }).save()
                    }
                })
        }

        public async importCompany(idx = 0){
            const api = this.getCustomAPI();

            api['apiEndpoint'] = '/company_profile'
            api['baseApiUrl'] = 'https://api.bexio.com/2.0';

            const bexioCompanies = await api.list();
            const bexioEntry = bexioCompanies[idx];
            if (!bexioEntry) return null;
            const company = new Company.Model()
            let dbCompany = await company.find(bexioEntry.id, 'externId');

            if (!dbCompany) {
                await company.initialiseData({
                    externId: bexioEntry.id,
                    fullName: bexioEntry.name,
                    name: bexioEntry.name.replace(' AG', '').replace(' GMBH', ''),
                    businessPhone: bexioEntry.phone_fixed,
                    legalForm: bexioEntry.legal_form
                }).save();
                company.updateKey('itoken', await randomToken(50));
                company.updateKey('ptoken', await randomToken(70));
            }

            this.bexio.companyId = company.getId() || dbCompany.getId();
            return this.bexio.companyId
        }

        protected getCustomAPI(){
            return  this.bexio.getCustomAPI()
        }
    }

    class BexioUsers{

        constructor(protected bexio:Bexio) {}

        public listUsers(){
            this.bexio.bexioApi.users['apiEndpoint'] = '/users'
            this.bexio.bexioApi.users['baseApiUrl']  = 'https://api.bexio.com/3.0';
            return this.bexio.bexioApi.users.list();
        }

        public getUser(id){
            this.bexio.bexioApi.users['apiEndpoint'] = '/users'
            this.bexio.bexioApi.users['baseApiUrl']  = 'https://api.bexio.com/3.0';
            return this.bexio.bexioApi.users.show(id).catch(()=>null)
        }

        public findDBUser(externId){
            return  new AuthUser().find(externId, 'externId')
        }

        async importUsers(){
            if(!this.bexio.companyId)return null;

            console.log('importUsers')
            const users = await this.listUsers();

            for (const user of users) {
                let dbUser: AuthUser = (await this.findDBUser(user.id)) ?? new AuthUser();
                if (dbUser.getId()) {
                    dbUser.updateKey('profileImage',  await this.getUserImageFromWebSite(dbUser['firstName'],dbUser['lastName']))

                }
                else {
                    await dbUser.initialiseData({
                        "externType":'BEXIO',
                        "externId": user.id,
                        "host":     user.email.split('@')[1],
                        "email":    user.email,
                        companyId:  this.bexio.companyId,
                        gender: user['salutation_type'] == 'male' ? 'M':'W',
                        firstName:  user.firstname,
                        lastName:  user.lastname,
                    }).save();
                    dbUser.updateKey('assignedCompanyId',this.bexio.companyId);
                    dbUser.updateKey('password','****');
                    dbUser.updateKey('usernameHash',cryptoUtils.hash(user.email,user.email,5));

                    try {
                        dbUser.updateKey('profileImage',  await this.getUserImageFromWebSite(user.firstname,user.lastname))
                    }
                    catch (e){
                        console.log(e)
                    }
                }
            }
        }

        async getUserImageFromWebSite(firstName,lastName){
            try{
                const baseUrl = 'https://www.onebyte.ch'
                const subUrl  = '/agentur';

                firstName     = firstName.replace(/ /g,'-').toLowerCase();
                lastName      = lastName.replace(/ /g,'-').toLowerCase();

                if(!this['dom']){
                    const htmlparser = require('node-html-parser');
                    const fetch = require("node-fetch");
                    var rawHtml =  await fetch(baseUrl+subUrl).then(text => text.text())
                    this['dom'] = htmlparser.parse(rawHtml).querySelectorAll('.employee-portrait img')
                    this['dom'] = this['dom'].map(v => v.rawAttrs.split('src="')[1].split('"')[0])
                }

                const escapeUmlaute = str => str.replace('ü','ue').replace('ä','ae').replace('ö','oe').replace('ż','z').replace('ł','l').replace('é','e').replace('é','e').replace('è','e').replace('è','e')
                const  src = this['dom'].find((src:string) => src.includes(firstName+'-'+lastName) || src.includes(lastName+'-'+firstName)) || this['dom'].find((src:string) => src.includes(escapeUmlaute(firstName)+'-'+escapeUmlaute(lastName)) || src.includes(escapeUmlaute(lastName)+'-'+escapeUmlaute(firstName)))
                return src ? (baseUrl+src): null
            }catch (e){
                return ''
            }
        }

        protected getCustomAPI(){
            return  this.bexio.getCustomAPI()
        }
    }

    class BexioAccounts{

        constructor(protected bexio:Bexio) {}

        public getAccountCategories(){
            let accountCatAPI  = this.getCustomAPI();
            accountCatAPI['apiEndpoint'] = '/account_groups '
            accountCatAPI['baseApiUrl']  = 'https://api.bexio.com/2.0';
            return accountCatAPI.list()
        }

        public getAccounts(){
            let accountAPI  = this.getCustomAPI();
            accountAPI['apiEndpoint'] = '/accounts '
            accountAPI['baseApiUrl']  = 'https://api.bexio.com/2.0';
            return accountAPI.list()
        }

        async importAccounts(){
            console.log('importAccounts')
            // category

            await this.getAccountCategories()
                .then(async categories => {
                let total = categories.length
                    for(let i = 0; i<total;i++){
                        let category = categories[i];
                        let parentId = null
                        if(category.parent_fibu_account_group_id){
                            const  dbCat = await AccountCategory.getCategoryByExternId(category.parent_fibu_account_group_id,this.bexio.companyId)
                            if(dbCat)parentId = dbCat.categoryId;
                        }
                        await new AccountCategory({
                            companyId:      this.bexio.companyId,
                            externType:     'BEXIO',
                            externId:       category.id,
                            categoryCode:   category.code,
                            categoryName:   category.name,
                            linkCategoryId: parentId,
                        }).save()
                    }
            });

            // account
            let rule = {
                all:true,
                code:{
                    from:3000,
                    till:3999
                }
            }

            this.getAccounts()
                .then(accounts => accounts.forEach(async account => {
                const { account_no, id, name, tax_id, fibu_account_group_id, account_type} = account;
                if(rule.all || (account_no>= rule.code.from && account_no<=rule.code.till)) {
                    const type = (()=>{
                        switch (account_type){
                            case 1:return'expense';
                            case 2:return'revenue';
                            case 3:return'active';
                            case 4:return'passive';
                            case 5:return'complete';
                        }
                    })()

                    let parentId = null;
                    if(fibu_account_group_id){
                        const  dbCat = await AccountCategory.getCategoryByExternId(fibu_account_group_id,this.bexio.companyId)
                        if(dbCat)parentId = dbCat.categoryId;
                    }

                    await new Account({
                        code:account_no,
                        externType:'BEXIO',
                        externId:id,
                        name:name,
                        companyId:this.bexio.companyId,
                        externCategoryId:fibu_account_group_id,
                        categoryId:parentId,
                        type:type
                    }).save()
                }
            }))
        }

        protected getCustomAPI(){
            return  this.bexio.getCustomAPI()
        }
    }

    class BexioTimeTracking{

        constructor(protected bexio:Bexio) {}

        public getTimeTracking(params:{order_by?:string,offset?:number,limit?:number} = {}){
            return this.bexio.bexioApi.timetrackings.list(params)
        }

        public importTimeTrackingSum(){
            console.log('insertTimeTrackingSum inserting...')
            return new Promise((async resolve=>{

                let limit   = 1000;
                const total = {};
                const fetched = {}

                const fetch = (offset )=>{
                    return new Promise(f => {
                        this.getTimeTracking({
                            order_by:'date_desc',
                            offset:offset * limit,
                            limit:limit,
                        })
                            .then( rows =>{
                              setTimeout(async()=>{

                                  if(!rows[0]) return f(1)

                                  let totalRows    = rows.length;
                                  let monthOffset  = 1;
                                  let currentMonth = null;

                                  for(let i = 0; i<totalRows;i++){
                                      const
                                          {

                                              id,
                                              date,
                                              duration,
                                              allowable_bill,
                                              client_service_id,
                                              user_id

                                          } = rows[i]

                                      if(fetched[id]){
                                          continue
                                      }

                                      fetched[id] = true;

                                      const _date              = moment(date);
                                      const {activityId,pricePerHour}       = await Company.Activity.getActivityByExternId(client_service_id,'BEXIO',this.bexio.companyId) || {};
                                      if(!activityId){
                                          console.log('activityId not found',client_service_id,'BEXIO',this.bexio.companyId)
                                          continue;
                                      }
                                      let {userId,firstName} = await AuthUser.getUserByExternId(user_id,'BEXIO') || {};
                                      if(!userId){
                                          let _user = await AuthUser.getUserByExternId('deleted','BEXIO') || {};
                                          userId = _user ? _user.userId : null
                                          if(!userId){
                                              console.log('user_id',user_id,userId)
                                              continue;
                                          }

                                      }


                                      let month   = _date.month() +monthOffset;
                                      let year    = _date.year();

                                      if(!currentMonth) currentMonth = month;
                                      if(currentMonth!=month){
                                          console.log('new month has began',currentMonth,month)
                                          currentMonth = month
                                      }

                                      if(!total[year]) total[year] = {
                                          [month] :
                                              {
                                                  [userId]:{
                                                      [activityId]:{
                                                          total:0,
                                                          value: 0,
                                                          totalBillable:0,
                                                          valueBillable:0,
                                                      }
                                                  }
                                              }
                                      };

                                      year = total[year]
                                      if(!year[month]) year[month] = {[userId]:{
                                              [activityId]:{
                                                  total:0,
                                                  value: 0,

                                                  totalBillable:0,
                                                  valueBillable:0,
                                              }
                                          }}

                                      month = year[month]
                                      if(!month[userId]) month[userId] = { [activityId]:{
                                              total:0,
                                              value: 0,

                                              totalBillable:0,
                                              valueBillable:0,
                                          }}

                                      let user = month[userId]
                                      if(!user[activityId]) user[activityId] = {
                                          total:0,
                                          value: 0,

                                          totalBillable:0,
                                          valueBillable:0,
                                      }

                                      let activity = user[activityId]

                                      let values = duration.split(':')
                                      let minutes = (60 * (+values[0])) + (+values[1])

                                      activity[allowable_bill ? 'totalBillable' : 'total']  += minutes / 60
                                      if(allowable_bill) activity.valueBillable   += (pricePerHour * (minutes/ 60))
                                      if(!allowable_bill) activity.value          += (pricePerHour * (minutes/ 60))

                                  }

                                  console.log('Fetching TrackingSum:',totalRows, rows[0].date, 'done',offset)
                                  return fetch((offset+1) ).then(f)
                              },100)
                            })
                    })
                }

                await fetch(0);

                console.log('done fetching')

                const conn = new Database()

                for (let year in total){
                    for(let month in total[year]){
                        for(let userId in total[year][month]){
                            for(let activityId in total[year][month][userId]){
                                const values = total[year][month][userId][activityId]
                                if(values.total>0) {
                                    await conn.insert(`  insert into TIME_SUM_Users (
                              companyId,
                              userId,     
                              year,           
                              month,          
                              activityId,     
                              total,
                              price
                         )
                           values (?,?,?,?,?,?,?) on duplicate key update total=VALUES(total), price=VALUES(price) `, [
                                        this.bexio.companyId,
                                        userId,
                                        year,
                                        month,
                                        activityId,
                                        values.total,
                                        values.value,
                                    ])
                                }
                                if(values.totalBillable>0){
                                    await conn.insert(`
                         insert into TIME_SUM_Users (
                              companyId,
                              userId,     
                              year,           
                              month,          
                              activityId,     
                              allowable_bill, 
                              total,
                              billable_price
                         )
                           values (?,?,?,?,?,?,?,?) on duplicate key update total=VALUES(total) , billable_price = VALUES(billable_price)`,
                                        [
                                            this.bexio.companyId,
                                            userId,
                                            year,
                                            month,
                                            activityId,
                                            1,
                                            values.totalBillable,
                                            values.valueBillable,
                                        ])
                                }
                            }
                        }
                    }
                }

                console.log('insertTimeTrackingSum: insert Done');
                resolve(true)

            }))
        }

        protected getCustomAPI(){
            return  this.bexio.getCustomAPI()
        }
    }

    class BexioOrders{
        constructor(protected bexio:Bexio) {}

        public getOrderRepetition(id, api = this.getCustomAPI()){
            let repetition  = this.getCustomAPI();
            repetition['apiEndpoint'] = '/kb_order/'+id+'/repetition'
            repetition['baseApiUrl']  = 'https://api.bexio.com/2.0';
            return repetition.list()
        }

        public getOrder(id){
            return this.bexio.bexioApi.orders.show(id)
        }

       public getOrders(offset,limit= 10){
            const doFetch = async (offset = 0)=> {
                return  this.bexio.bexioApi.orders.list({
                    order_by:'id_asc',
                    limit: limit,
                    offset:offset
                })
            }
            return doFetch(offset)
        }

       async getRecurringOrders(clear = true){

            const waitTill = (ms)=>new Promise(reso=>setTimeout(reso,ms))

            if(clear){
                await new Database()
                    .delete('delete from FIN_LIST_Subscriptions where companyId = ?'
                        ,[this.bexio.companyId]);
                console.log('FIN_LIST_Subscriptions cleared','done',this.bexio.companyId)
            }

            class Subscription{
                id:         number;
                type:       string;
                start:      string;
                end:        string;
                interval:   number;
                total:      number
                title:      string
                total_gross:number
                index = {
                    year:null,
                    month:null,
                }
                articleIds:string;

                constructor(bexioData) {
                    this.id          = bexioData.id
                    this.start       = bexioData.start
                    this.end         = bexioData.end
                    this.total       = bexioData.total
                    this.total_gross = bexioData.total_gross
                    this.title       = bexioData.title
                    this.articleIds  = bexioData.articleIds

                    Object.assign(this,bexioData.repetition);

                    this.index.year = this.start.split('-')[0]
                    this.index.month = this.start.split('-')[1]
                }

                getYear(){
                    return this.index.year
                }

                getMonth(){
                    return this.index.month
                }

                getSubscriptionType() {
                   try {
                       if(this.title){
                           let title = this.title.trim().split(' ')[1] ??  this.title.trim().split(' ')[0];
                           if(this.title){
                               const _title = (this.title+'').toLowerCase()
                               if(_title.includes('domain'))   return 'Domain';
                               if(_title.includes('hosting'))  return 'Hosting';
                               if(_title.includes('workshop')) return 'Workshop';
                               if(_title.includes('wpsp'))     return 'WPSP';
                               if(_title.includes('ads'))      return 'Ads';
                               if(_title.includes('foto'))     return 'Foto';
                               if(_title.includes('wp smart')) return 'WP Smart';
                               if(_title.includes('wp rocket')) return 'WP Rocket';
                           }

                           if(title) return title ? title.trim().slice(0,10) : null
                       }
                       return null
                   }catch (e){
                       console.error('Error: getSubscriptionType:')
                       console.error(e)
                   }
                }

                getIntervalType() {
                   return this.type.slice(0,1)
                }

                getInterval() {
                    return this.interval
                }

                getTitle(){
                    try{

                    if(this.title){
                        let title = this.title.trim().split(' ').pop();
                        if(title.length<3){
                            let title = this.title.trim().split(' ');
                            return title[title.length-2]+' '+title[title.length-1]
                        }
                        return  title;
                    }
                    return  null
                    }catch (e){
                        console.error('Error: getTitle:')
                        console.error(e)
                    }
                }

                getTotalMonthly(){
                    let intervalType = this.getIntervalType();
                    if(intervalType==='y'){
                       return  this.total / (12*this.interval)
                    }else if(intervalType === 'm'){
                        return  this.total / this.interval
                    }
                    return 0
                }

                addToIndex(result){
                    if(!result[this.getYear()])result[this.getYear()] = {}
                    if(!result[this.getYear()][this.getMonth()])result[this.getYear()][this.getMonth()] = {}
                    result[this.getYear()][this.getMonth()][this.id] = this
                return this
                }

                saveToDatabase(db,companyId){
                    db.insert(`insert into FIN_LIST_Subscriptions
(companyId, subscriptionId,subscriptionType, intervalType, \`interval\`, start, end, total, total_monthly, total_gross, title,articleIds) 
VALUES (
  ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?     
) on duplicate key update 
                          total=VALUES(total), 
                          total_monthly=VALUES(total_monthly),
                          total_gross=VALUES(total_gross),
                          intervalType=VALUES(intervalType),
                          subscriptionType=VALUES(subscriptionType),
                          start=VALUES(start),
                          end=VALUES(end),
                          title=VALUES(title),
                          articleIds=VALUES(articleIds)
                          `,[
                        companyId,
                        this.id,
                        this.getSubscriptionType(),
                        this.getIntervalType(),
                        this.getInterval(),
                        this.start,
                        this.end,
                        this.total,
                        this.getTotalMonthly(),
                        this.total_gross,
                        this.getTitle(),
                        this.articleIds
                    ])
                }
            }

            let limit  = 1000;
            let result = {}

           const db = new Database()
           const doFetch = async (index = 0)=> {

               let orders     = await this.getOrders(index * limit,limit)
               let hasItem    = !!orders[0];
               orders         = orders.filter( a => a.is_recurring && a.kb_item_status_id != 21);

               let totalItems = orders.length;
               let logState   = true;

               console.log('fetching getRecurringOrders:',index,totalItems,'nextPage',hasItem);

               try {
                   for(let i = 0; i<totalItems;i++){
                       let {positions} = await this.getOrder(orders[i].id);
                       let article_ids = positions.filter(p => p.type === 'KbPositionArticle').map(obj => obj.article_id)
                       article_ids = article_ids.filter(function(item, pos) {
                           return article_ids.indexOf(item) == pos;
                       })

                       await new Subscription({
                           id: orders[i].id,
                           title:orders[i].title,
                           total:orders[i].total_gross, // without vat
                           total_gross:orders[i].total, // with vat,
                           articleIds:article_ids.length ? article_ids.join(','):null,
                           ... await this.getOrderRepetition(orders[i].id)
                       }).addToIndex(result).saveToDatabase(db,1)
                       if(logState && (i % 50 === 0) )console.log(index,'state:',i,'of',totalItems)
                       await waitTill(100);
                   }
               }catch (e){
                   console.error('Error getRecurringOrders doFetch')
                   console.error(e)}

                if(hasItem) return await doFetch(index+1)
            }

           await doFetch();
           console.log('fetching getRecurringOrders done');
        }

        protected getCustomAPI(){
            return  this.bexio.getCustomAPI()
        }
    }

    class BaseData{

        constructor(protected bexio:Bexio) {}

        async importBaseData(){
            await this.importCompany(0);
            console.log(this.bexio.companyId,'importBaseData','loaded');
            await this.importAccounts()
            await this.importUsers();
            await this.importCompanyActivities();
            console.log(this.bexio.companyId,'importBaseData','done','\n');
        }

        public importCompanyActivities(){
            return this.bexio.company.importCompanyActivities()
        }

        public importCompany(idx = 0) {
          return this.bexio.company.importCompany(idx);
        }

        public importUsers(){
           return this.bexio.users.importUsers()
        }

        public importAccounts(){
            return this.bexio.accounts.importAccounts();
        }
    }

    export class Testing{

        public readonly bexio:Bexio = new Bexio(this.token);

        constructor(private token:string) {

        }

         importBaseData(){
            return new BaseData(this.bexio).importBaseData()
        }


        public run(){
          this.bexio.orders.getRecurringOrders()
        }

        public importTimeTrackingSum(){
            return this.bexio.timeTracking.importTimeTrackingSum()
        }
    }

    class BexioReporting{

        constructor(protected bexio:Bexio) {}


        protected getCustomAPI(){
            return  this.bexio.getCustomAPI()
        }

        public async importRevenueByAccount(year = 2020,importAccounts = true){

            if(importAccounts) await this.bexio.accounts.importAccounts()

            const insertIntoDB = async (total,filter:number[] = null ) => {
                const conn     = new Database();

                for (let year in total){
                    for(let month in total[year]){
                        for(let accountId in total[year][month]){

                            let dbAccount = await Account.getAccountByExternId(+accountId,'BEXIO',this.bexio.companyId)

                            if(!dbAccount || !dbAccount.accountId)
                            {
                                console.log('Accounts.ExternId not found:',+accountId,this.bexio.companyId)
                                continue
                            }
                            if(filter && filter.length) {
                                if (!(dbAccount.accountId >= filter[0] && dbAccount.accountId <= filter[1])) continue
                            }

                            await conn.insert(`
                         insert into FIN_SUM_Revenue (companyId, accountId, month, year,total,total_gross)
                           values (?,?,?,?,?,?) on duplicate key update total=VALUES(total) ,    total_gross = VALUES(total_gross)`, [
                                this.bexio.companyId,
                                dbAccount.accountId,
                                +month,
                                +year,
                                total[year][month][accountId].total,
                                total[year][month][accountId].total_tax || 0
                            ])
                        }
                    }
                }
                console.log('insert done',year)
            }

            for(let i = 0;i<12;i++){

                let month = moment(year+'-01-01').startOf('year').add(i,'month');

                await this.getJournalByMonth(month).then(rows => insertIntoDB(rows,[69 ,77]))

                await this.getSumRevenue(month,month,true).then(rows => insertIntoDB(rows));
            }

        }

        getInvoiceSummaryByMonth(start,end){
            start = moment(start).startOf('month').format('YYYY-MM-DD')
            end   = moment(end).endOf('month').format('YYYY-MM-DD')

            return new Promise(async resolve =>{
                let months = {}
                const api = this.getCustomAPI();
                api['apiEndpoint'] = '/kb_invoice'
                api['baseApiUrl'] = 'https://api.bexio.com/2.0'
                const invoices = await api.list({
                    limit:1000000,
                    order_by:'id_desc'
                });

                let dates     = [
                    new Date(start), new Date(end),
                ]
                let _currentD:Date = null;


                for (const invoice of invoices) {
                    _currentD = new Date(invoice.is_valid_from)
                    if(_currentD >= dates[0] && _currentD <= dates[1]){
                        if(

                            invoice.kb_item_status_id == 9 ||
                            invoice.kb_item_status_id == 8 ||
                            invoice.kb_item_status_id == 16
                            //test.kb_item_status_id != 7
                        ) {

                            if(!months[_currentD.getMonth()+1]) months[_currentD.getMonth()+1] = {
                                total:0,
                                total_gross:0,
                            }

                            months[_currentD.getMonth()+1].total          += +invoice.total
                            months[_currentD.getMonth()+1].total_gross    += +invoice.total_gross
                        }
                    }
                }

                return resolve(months)
            })


        }



        /**
         * Calculates the revenue by invoices
         * */
        getSumRevenue(start,end, gross = true):Promise<any>{
            // gross = brutto
            console.warn('add pagination')

            const getLineItems = async (document_nr) => {
                let result = {
                    total:0,
                    discount:0,
                    data:[],
                    by_accounts:{},
                    invoiceId:document_nr,
                    userId:null
                }
                const api  = this.getCustomAPI();
                api['apiEndpoint'] = '/kb_invoice'
                api['baseApiUrl'] = 'https://api.bexio.com/2.0';

                const invoice = await api.show(document_nr);

                if(!invoice || !invoice.positions){
                    console.log('invoice not valid',document_nr)
                    return result
                }

                let billingDate = moment(invoice.is_valid_from);
                let monthOffset = 1;

                let discount_total    = 0;
                let discount_per_item = 0
                let items     = invoice.positions.filter(item => item.position_total !== undefined);
                let discounts = invoice.positions.filter(item => item.type ===  'KbPositionDiscount');

                discounts.forEach(item => discount_total+= +item.discount_total);
                discount_per_item = discount_total / items.length;

                items.forEach(item => {
                    if(
                        item.position_total === undefined
                        //  ||  item.type ===  'KbPositionSubtotal'
                        //  ||  item.type ===  'KbPositionPagebreak'
                        //  ||  item.type ===  'KbPositionDiscount'
                        //  ||  item.type ===  'KbPositionText'
                    )return;

                    item.position_total =  +item.position_total  - (gross ? 0 : discount_per_item)
                    result.total        += +item.position_total
                    result.discount     += +item.discount

                    result.data.push({
                        "tax_id":     item.tax_id,
                        "tax_value":  item.tax_value,
                        "account_id": item.account_id,
                        "article_id": item.article_id,
                        "total":      item.position_total,
                        "discount":   item.discount_in_percent,
                        month:        billingDate.month() + monthOffset,
                        year:         billingDate.year(),
                        total_tax   : (+item.position_total  / 100) * +item.tax_value
                    });


                    if(!result.by_accounts[item.account_id]) result.by_accounts[item.account_id] = {total:0,total_tax:0,month:billingDate.month()+monthOffset,year:billingDate.year()};
                    result.by_accounts[item.account_id].total     += +item.position_total
                    result.by_accounts[item.account_id].total_tax += (+item.position_total  / 100) * +item.tax_value;
                });

                return result;
            }

            start = moment(start).startOf('month').format('YYYY-MM-DD')
            end   = moment(end).endOf('month').format('YYYY-MM-DD')

            let result = [];
            let total  = {};

            return new Promise(async resolve => {

                const api          = this.getCustomAPI();
                api['apiEndpoint'] = '/kb_invoice'
                api['baseApiUrl']  = 'https://api.bexio.com/2.0'
                const invoices     = await api.list({
                    limit:1000000,
                    order_by:'id_desc',
                });

                let dates          = [
                    new Date(start), new Date(end),
                ]
                let currentD:Date  = null;
                let logState       = true
                let totalFetched   = invoices.length

                console.log(
                    'getRevenue total Found',
                    invoices.length,
                    'last entry',
                    invoices[invoices.length-1].is_valid_from
                )

                let i = 0;
                for (const invoice of invoices) {
                    i++
                    currentD = new Date(invoice.is_valid_from)
                    if(currentD >= dates[0] && currentD <= dates[1]){
                        if(

                            invoice.kb_item_status_id == 9 ||
                            invoice.kb_item_status_id == 8 ||
                            invoice.kb_item_status_id == 16
                            //test.kb_item_status_id != 7
                        ) {
                            let items = await getLineItems(invoice.id);

                            if(+invoice.total_gross !== +items.total && Math.abs(+invoice.total_gross - +items.total)>2){
                                console.warn('sum does not match ('+(Math.abs(+invoice.total_gross - +items.total))+')', +invoice.total_gross , +items.total, invoice.id, invoice, items)
                            }
                            else {
                                result.push(items);
                            }
                        }
                    }
                    if(logState && (i % 50 === 0) )console.log('state:',i,'of',totalFetched)
                }

                // sum by accounts
                let totalItems = result.length;

                for(let i = 0;i<totalItems;i++){
                    let by_accounts = result[i].by_accounts;
                    for(let accountId in by_accounts){
                        if(!total[by_accounts[accountId].year]) total[by_accounts[accountId].year] = {
                            [by_accounts[accountId].month] :
                                {
                                    [accountId]:{total:by_accounts[accountId].total,total_tax:by_accounts[accountId].total_tax}
                                }
                        };
                        else {

                            let year = total[by_accounts[accountId].year]
                            if(!year[by_accounts[accountId].month]) year[by_accounts[accountId].month] = {[accountId]:{total:by_accounts[accountId].total,total_tax:by_accounts[accountId].total_tax}}
                            else {
                                let month = year[by_accounts[accountId].month];
                                if(!month[accountId]) month[accountId] = {total:by_accounts[accountId].total,total_tax:by_accounts[accountId].total_tax}
                                else {
                                    month[accountId].total += by_accounts[accountId].total
                                    month[accountId].total_tax += by_accounts[accountId].total_tax
                                }
                            }
                        }
                    }

                }

                console.log('done: getRevenue',start)
                return  resolve(total)
            });
        }

        /*
        * Gets the acconuts value by month
        * */
        getJournalByMonth(month){
            let start = moment(month).startOf('month');
            let end   = moment(start).endOf('month');
            const api = this.getCustomAPI();
            api['apiEndpoint'] = '/accounting/journal'
            api['baseApiUrl'] = 'https://api.bexio.com/3.0'
            return api.list({
                "from":start.format('YYYY-MM-DD'),
                "till":end.format('YYYY-MM-DD'),
            }).then(async list =>
            {

                let monthOffset = 1;
                let totalItems = list.length;
                let logState   = true;

                const total = {}
                for(let i   = 0;i<totalItems;i++){

                    const item = list[i];
                    const date = moment(item.date);

                    if(!date.isBetween(start,end, 'days', '[]'))continue;

                    const {debit_account_id,credit_account_id,amount} = item;
                    let {accountId} = {accountId:debit_account_id} //await Account.getAccountByExternId(debit_account_id,'BEXIO',1)


                    let month   = date.month() +monthOffset;
                    let year    = date.year();

                    if(!total[year]) total[year] = {
                        [month] :
                            {
                                [accountId]:{total:amount}
                            }
                    };
                    else {
                        year = total[year]
                        if(!year[month]) year[month] = {[accountId]:{total:amount}}
                        else {
                            month = year[month]
                            if(!month[accountId]) month[accountId] = {total:amount}
                            else {
                                month[accountId].total += amount
                            }
                        }
                    }


                    if(logState && (i % 50 === 0) )console.log('state:', i , 'of' , totalItems);

                }
                console.log('done: getAccountsValue',start.format('YYYY-MM-DD'))
                return total;

            })
        }

    }

}
