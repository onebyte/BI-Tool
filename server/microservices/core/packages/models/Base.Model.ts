import Database from "../database/Connection";

export default class BaseModel {

    protected readonly db:Database = new Database();

    protected _tableName:string          = '';

    protected _primaryKey:string         = '';

    protected _fillable                  = [];

    protected __onDuplicateKeyUpdate     = false

    public _log     = false

    constructor(data:any = {}) {}

    initialiseData(data, secure = true):this{
        if(!data)return this;

        if(secure){
            for(let key in data){
                if(this._fillable.find(fill => fill === key) ||
                    (key === this._primaryKey && !this[this._primaryKey])){
                    this[key] = data[key]
                }
            }
        }
        else {
            for(let key in data){
                this[key] = data[key]
            }
        }

        return this;
    }

    public getId(){
        return this[this._primaryKey];
    }


    public list(filterParams){
        return this.db.getRows(`select * from ${this._tableName}`);
    }

    public save():Promise<any>{
        if(!this.__onDuplicateKeyUpdate && this[this._primaryKey])return this.update();
        const keys = this._fillable.filter(a => this[a]!==undefined);
        let   updateKeys = '';

        if(this.__onDuplicateKeyUpdate){
             updateKeys = keys.map(key => key !== this._primaryKey ? `${key}=VALUES(${key}),` : '').join('')
             updateKeys  = 'ON DUPLICATE KEY UPDATE '+updateKeys.substring(0, updateKeys.length - 1)
        }

        let query = `
            insert into ${this._tableName} 
                ( ${keys.join(',')})
             values 
                (${keys.map( v => '?' ).join(',')})
             ${updateKeys}   
        `;

        let params = keys.map(v=>this[v]);

        if(this._log){
            console.log(query,params)
        }

        return this.db.insert(query,params).then(id => {
            if(this._primaryKey){
                this[this._primaryKey] = id;
            }
            return id;
        })
    }

    public update(){
        console.log('update not implemented');
        return new Promise((resolve=> {
            resolve(false);
        }));
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
            this.db.updateTable(this._tableName).set(key,value).where(this._primaryKey,this[this._primaryKey]).query()
        }

        return  this;
    }

    public find(id,pKey:string= this._primaryKey):Promise<this>{
       return this.db.getRow(`select * from ${this._tableName} where ${pKey} = ?`,[id],this.constructor)
    }

    static getDB():Database{
        return new Database()
    }
}

class GenericBaseModel<Type> extends BaseModel{


    create(){

    }

    delete(){

    }

}