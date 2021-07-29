import BaseModel from "../../../../core/packages/models/Base.Model"

export namespace Finances {

    export class Account extends BaseModel {

        protected _primaryKey = 'accountId'

        protected _tableName = 'FIN_Account'

        protected _fillable  = [
            "accountId",
            "companyId",
            "externId",
            "externType",
            "code",
            "type",
            "name",
            "taxId",
            "categoryId",
            "externCategoryId"
        ]

        protected __onDuplicateKeyUpdate = true

        accountId:number

        companyId:number

        externId:number

        externType:string

        code:number

        type: 'active'|'passive'|'revenue'|'expense'|'complete'

        name:string

        taxId:number

        categoryId:number

        externCategoryId:number;

        constructor(data = null) {
          super();if(data)this.initialiseData(data,false)
        }

        public all():Promise<Account[]>{
            return this.db.getRows(`
            select A.*,
       C.categoryName, 
       C.categoryCode, 
       C.linkCategoryId from FIN_Account A
left join FIN_AccountCategory C  on
    (A.companyId = C.companyId or (A.companyId is null and C.companyId is null ))
and A.categoryId = C.categoryId where A.companyId = ? order by   A.code`,[this.companyId])
        }

        public update(){
            return new Promise(resolve => {

            })
        }

        public updateKey(key,value, tableName = this._tableName, whereValue:any = null,whereQuery:any = null) {
            console.warn('not implemented updateKey')
            return this
        }

        public find(id,pKey:string= this._primaryKey):Promise<this>{
            return this.db.getRow(`select * from ${this._tableName} where ${pKey} = ? and companyId = ?`,[id, this.companyId],this.constructor)
        }

        static getAccountByExternId(externId,type,companyId){
            return Account.getDB().getRow('select * from FIN_Account where companyId = ? and externType = ? and externId = ? ', [companyId,type,externId])
        }

        static getAccountByCode(code,companyId){
            return Account.getDB().getRow('select * from FIN_Account where companyId = ? and code = ? ', [companyId,code])
        }

    }

    export class AccountCategory extends BaseModel {

        protected _primaryKey = 'categoryId';

        protected _tableName = 'FIN_AccountCategory';

        protected _fillable  = [
            "categoryId",
            "linkCategoryId",
            "categoryName",
            "categoryCode",
            "categoryType",
            "categoryActive",
            "companyId",
            "externId",
            "externType",
        ]

        protected __onDuplicateKeyUpdate = true;

        categoryId:number;

        linkCategoryId:number;

        externId:number;

        externType:string;

        companyId:number;

        categoryName:string;

        categoryCode:number;

        categoryType:string;

        categoryActive:boolean;


        constructor(data = null) {
         super()
            if(data)this.initialiseData(data,false)
        }


        public update(){
            return new Promise(resolve => {

            })
        }

        public updateKey(key,value, tableName = this._tableName, whereValue:any = null,whereQuery:any = null) {
            console.warn('not implemented updateKey')
            return this
        }

        public find(id,pKey:string= this._primaryKey):Promise<this>{
            return this.db.getRow(`select * from ${this._tableName} where ${pKey} = ? and companyId = ?`,[id, this.companyId],this.constructor)
        }

        static getCategoryByExternId(externId,companyId){
            return AccountCategory.getDB().getRow('select * from FIN_AccountCategory where companyId = ? and externId = ? ', [companyId,externId])
        }



    }
}