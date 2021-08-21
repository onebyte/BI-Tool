import BaseModel from "./Base.Model";

export namespace Company{

    export class Model    extends BaseModel {

        private locationKey

        private companyId

        private name

        private fullName

        private contactPerson

        private businessPhone


        protected _tableName  = 'COM_Company';

        protected _primaryKey = 'companyId';

        protected _fillable = [
            'name',
            'fullName',
            'externId',
            'legalForm',
            'logo',
            'contactPerson',
            'businessPhone'
        ]

        constructor(data = null) {
            super();
            this.initialiseData(data)
        }


    }

    export class Label    extends BaseModel {

        private labelId;

        private companyId;

        private type;

        private title;

        private color;

        private lang;


        protected _tableName  = 'COM_Label';

        protected _fillable   = [
            'labelId',
            'companyId',
            'type',
            'title',
            'color',
            'lang',
        ];

        protected _primaryKey = 'labelId';


        constructor(opts = null) {
            super();
            if(opts)this.initialiseData(opts,false)
        }

        /**
         *
         * */
        public isDBEntry(){
            return (this.companyId > 0&& this.type && this.labelId >0)
        }

        public setLabelId(id){
            this.labelId = id;
        }

        public create(type:string,title:string,companyId:string,lang:string = null){
            this.type       = type;
            this.companyId  = companyId;
            this.title      = title;
            this.lang       = lang;
            return this.save()
        }

        public saveColor(color){
            this.db.updateTable(this._tableName)
                .set('color',color)
                .where(null,[this.companyId,this.labelId],'companyId = ? and labelId = ?')
                 .queryOnValue()

        }

        public saveTitle(title){
            this.db.updateTable(this._tableName)
                .set('title',title)
                .where(null,[this.companyId,this.labelId],'companyId = ? and labelId = ?')
                 .queryOnValue()
        }

        public save():Promise<any>{
            if(this.isDBEntry()) return this.update();

            const keys = this._fillable.filter(a => this[a]!==undefined);
            let   updateKeys = ''
            if(this.__onDuplicateKeyUpdate){
                updateKeys = keys.map(key => key !== this._primaryKey ? `${key}=VALUES(${key}),` : '').join('')
                updateKeys  = 'ON DUPLICATE KEY UPDATE '+updateKeys.substring(0, updateKeys.length - 1)
            }

            let query = `
            insert into ${this._tableName} 
                ( ${keys.join(',')})
             values 
                (${keys.map(v=>'?').join(',')})
             ${updateKeys}   
        `;

            let params = keys.map(v=>this[v])

            return this.db.insert(query,params).then(id => {
                if(this._primaryKey){
                    this[this._primaryKey] = id;
                }
                return id;
            })
        }

        public update(){
            console.warn(' not implemented')
            return new Promise(resolve => resolve([]))
        }

        public updateKey(key,value, tableName = this._tableName, whereValue:any = null,whereQuery:any = null) {

            if(whereQuery){
                this.db.keyExists(key,tableName).then(exists => {
                    exists ? this.db.updateTable(tableName).
                        set(key,value).where(null,whereValue,whereQuery).queryOnValue()
                        : null
                })
            }
            else {
                if(!this[this._primaryKey])return this;
                this.db.updateTable(this._tableName).set(key,value).where(null,[ this.companyId,this.type, this.labelId],'companyId = ? and type = ? and labelId = ?').query()
            }

            return  this;
        }

        public find(id:number,type = this.type, companyId = this.companyId):Promise<this>{
            return this.db.getRow(`select * from ${this._tableName} where companyId  = ? and type = ? and labelId = ?`,[this.companyId,this.type,id],this.constructor)
        }

        public getTitle():Promise<string>{
            return new Promise(async resolve => {
                if(this.title)return this.title;
                if(!this.labelId && this.type){
                   this.labelId = await this.db.getValue('select labelId from COM_Group where companyId = ? and type = ? limit 1',[
                        this.companyId,this.type
                    ],'labelId',null)
                }

                return this.find(this.labelId)
                    .then(row => this.initialiseData(row))
                     .then(()=> resolve(this.title))
            })
        }

        public delete(labelId:string){
            this.db.delete(`delete from ${this._tableName} where companyId = ? and labelId = ?`,[
                this.companyId, labelId
            ])
        }
    }

    export class Group    extends BaseModel {

        private companyId;

        private labelId;

        private type;

        private readonly title;

        public label:Label;

        protected _tableName = 'COM_Group'


        constructor(opts:{companyId:number,lang?:string,type?:string} = null) {
            super();
            this.initialiseData(opts,false)
            this.label = new Label({companyId:opts.companyId, type:opts.type})
        }

        public getType():string{
            return this.type
        }

        public getTitle():Promise<string>{
            return this.label.getTitle()
        }

        public getIds():Promise<any[]>{
            return this.db.getRows(`select * from ${this._tableName} where companyId = ? and type = ? `,
                [this.companyId , this.getType()]);
        }

        public create(type:string  ,title:string ,color:string,  labelId:number = null, refIds:number[] = null){
            return new Promise(async resolve => {

            if(!this.companyId){
                return resolve([])
            }

            // Set Type
            this.type = type;

            // set LabelId
            this.labelId = labelId;
            this.label.setLabelId(this.labelId)

            // set LabelId
            if(!this.labelId){
                this.labelId = await this.label.create(this.getType(),title, this.companyId)
                if(color) this.label.saveColor(color)
            }
            else {
                this.label.saveColor(color)
                this.label.saveTitle(title)
            }

           await this.db.delete(`delete from ${this._tableName} where companyId = ? and type = ? and labelId = ?`,[
               this.companyId,type,this.labelId
           ])

            const ids = []
            // set Ids
            if(refIds && refIds.length){
                for(let i = 0; i < refIds.length;i++){
                    const userId = refIds[i];
                    await this.db.insert(`insert into ${this._tableName} (labelId,companyId,type,userId) values (?,?,?,?);`,[this.labelId,this.companyId,type,userId])
                        .then((id)=>ids.push(id))
                }
            }

            return resolve(ids);

            })
        }

        public async saveActivities(type,Ids,labelId = this.labelId){
            await this.db.delete('delete from COM_GroupLink where companyId = ? and source = ? and type = ? and labelId = ?',[
                this.companyId,'activities',type,labelId
            ])
            for(let i = 0;i<Ids.length;i++){
                await this.db.insert(`insert into COM_GroupLink (source,type,labelId,companyId,linkId) values ('activities',?,?,?,?);`,
                    [type,labelId,this.companyId,Ids[i]])
            }
        }
        public async saveUsersLead(type,Ids,labelId = this.labelId){
            await this.db.update(`update ${this._tableName} set lead = 0 where companyId = ? and type = ? and labelId = ?`,[
                this.companyId,type,this.labelId
            ])
            if(Ids && Ids.length){
                for(let i = 0; i < Ids.length;i++){
                    const userId = Ids[i];
                    await this.db.insert(`update ${this._tableName} set lead = 1 where companyId = ? and type = ? and labelId = ? and userId = ? limit 1;`,[this.companyId,type,this.labelId,userId])
                }
            }
        }

        async deleteByRef(refIds:number[] = []){
            if(refIds && refIds.length){
                for(let i = 0; i < refIds.length;i++){
                    const userId = refIds[i];
                    await this.db.delete(`delete from ${this._tableName} where companyId = ? and type = ? and userId = ?`,[
                        this.companyId,this.getType(),userId
                    ])

                }
            }
        }

        async deleteByLabelId(labelId = this.labelId){
             this.db.delete(`delete from ${this._tableName} where companyId = ? and labelId = ?`,[
                 this.companyId, labelId
            ])
            return this.label.delete(labelId)
        }

        public get(type:string = this.type){

        }

        /**
         * TODO rename to List
         * */
        public all(type:string){
            return this.db.getRows(`
                select L.labelId, L.type, L.title, L.color, 
                       group_concat(G.userId) as users ,
                       GROUP_CONCAT(if(G.lead, G.userId, null)) as usersLead
                from COM_Label L
                        left join COM_Group G  on 
                            (
                               L.companyId = G.companyId and 
                               L.type      = G.type      and 
                               L.labelId   = G.labelId
                            )
                where L.companyId = ? and L.type = ?
                group by L.labelId,L.type, L.title, L.color
            `,[this.companyId,type])
                .then(async rows =>
                    {
                        for(let i = 0;i<rows.length;i++){
                            let row = rows[i];

                            /* Count */
                            if(row.users) row.countUsers = row.users.split(',').length
                            if(row.usersLead) row.countUsersLead = row.usersLead.split(',').length

                            /*Load activities */
                            row.activities = await this.db.getRows('select * from COM_GroupLink where companyId = ? and source = ? and type = ? and labelId = ?', [this.companyId,'activities',type, row.labelId])
                            if(row.activities) row.activities = row.activities.map(v => +v.linkId)

                            /**Prevent null values*/
                            if(!row.users)row.users = '';
                            if(!row.usersLead) row.usersLead = '';

                        }
                        return rows
                    }
                )
        }
    }

    export class Activity extends BaseModel {

        private activityId;

        private companyId;

        private title;

        private billable;

        private accountId;

        private pricePerHour;

        protected _fillable = [
            "activityId",
            "companyId",
            "title",
            "billable",
            "accountId",
            "pricePerHour",
            "color",
            "code",
            "externType",
            "externId"
        ]

        protected _primaryKey = 'activityId'

        protected __onDuplicateKeyUpdate = true;

        protected _tableName = 'COM_Activities'

        constructor(data = {}) {
            super();
            this.initialiseData(data)
        }

        static getActivityByExternId(externId,type,companyId){
            return Activity.getDB().getRow('select * from COM_Activities where companyId = ? and externType = ? and externId = ? ', [companyId,type,externId])
        }

        public list(params:any = {}){
            let qSelect = '*';

            if(params){
                if(params.simple){
                    qSelect = 'title,activityId,code'
                }
            }


           return this.db.getRows(`
                select ${qSelect} from ${this._tableName} where companyId = ?`,[this.companyId])
        }
    }

}


