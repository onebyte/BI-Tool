import BaseModel from "../../../../core/packages/models/Base.Model"

export class ManualEntries extends BaseModel {

    protected _primaryKey = 'companyId,entryType,entryId'

    protected _tableName = 'FIN_LIST_ManualEntries'

    protected _fillable  = [
        'companyId',
        "entryId",
        "entryType",
        "entrySource",
        "title",
        "date",
        "total"
    ]

    protected __onDuplicateKeyUpdate = true

    companyId;

    entryId;

    entryType :'targets'|'results';

    entrySource;

    title;

    date

    total


    constructor(data = null) {
        super();if(data)this.initialiseData(data,false);

    }

    public list(filterParams){
        return this.db.getRows(`select *, year( date ) from ${this._tableName} where companyId = ? order by date desc, entryType, entrySource`,[
            this.companyId
        ]);
    }


    public update(){

        let canQuery = true

        let values = []
        const keys = this._fillable.filter(a => {
            if( this[a]!==undefined && !this._primaryKey.includes(a)){
                values.push(this[a])
                return true
            }
        });

        let where  = this._primaryKey.split(',')
        where.forEach(whereKey => {

            if(!this[whereKey]){
                canQuery = false
                return false
            }

            values.push(this[whereKey])
        })

        if(!canQuery)return

        let query = `
            update ${this._tableName} set
                 ${keys.map(key => key+` =  ?`).join(',')}
             where 
             ${where.map(key => key+`= ?`).join(' and ')}   
        `;


        return this.db.update(query,[...values])
    }

    public delete(id){
        this.entryId = id;
        let canQuery = true;
        let values   = [];
        let where    = this._primaryKey.split(',');
        where.forEach(whereKey => {
            if(!this[whereKey]){
                canQuery = false
                return false
            }
            values.push(this[whereKey])
        });


        if(!canQuery)return new Promise(resolve=>resolve(false));

        return this.db.delete(`delete from ${this._tableName} where  ${where.map(key => key+` = ?`).join(' and ')} `,values)
    }

}