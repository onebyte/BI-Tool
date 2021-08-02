/**
* Simple MYSQL Query Wrapper
* WDS 
*/
const mysql2 = require('mysql2/promise');

const die                     = (c:number = 1 ) => process.exit(c);

let db_config                 =  {
    "app_name": process.env.APP_NAME,
    "host"    : process.env.DB_HOST ,
    "database": process.env.DB_NAME,
    "user"    : process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "dateStrings": true
};

export default class Database {

    // Log Query's;
    debugActive = false;

    // ignore errors
    silenceMode;

    dieOnFatal = true;

    protected query;

    protected pool;

    constructor(){

    }

    public getDBName():string{
      return db_config.database;
    }

    private getConnection(): Promise<any>{
        if(!this.pool) this.pool = getSingleton()
        return this.pool.getConnection()
    }

    private handleError(resolve,sql,args,error , conn){

        if(conn) conn.release()


         if(this.silenceMode){
             resolve(null)
         }
        else {
             console.error(-1,error  + sql + JSON.stringify(args), 'insert MYSQL', 'DBConnection',  !this.silenceMode)
             resolve(error)
         }
        try{
            if(this.dieOnFatal &&
                (
                    error.toString().includes('fatal'                   )||
                    error.toString().includes('WSREP'                   )||
                    error.toString().includes('Column count doesn'      )||
                    error.toString().includes('Duplicate entry'         )||
                    error.toString().includes('doesn\'t exist'          )||
                    error.toString().includes('error in your SQL syntax')||
                    error.toString().includes('Unknown column'          )
                )
        )die()}catch (e) {}

    }

    private debug(x,y, dbResolver){
        this.query = {sql:x,args:y}
        if(y) for (let i = 0, l = y.length; i < l; i++) {
            if (typeof (y[i])=='undefined' || (typeof (y[i])=='object')) {
                x = '';
                if(y[i] && typeof (y[i])=='object'){
                    dbResolver([])
                    console.error('SQL err: convert to intiger ',y[i],this.query)
                    y[i] = -11113
                }

                return new Promise(r=>r('')) ;
            }
        }
        return new Promise(resolve => {
            if(this.debugActive){
                console.log(x,y)
                if(typeof y!=='object'){
                    console.log('\n \n \n ARGS is not an array \n \n \n')
                }
            }
            resolve( this.query )
        })
    }

    public insert = (sql, args = []):Promise<number|any> =>
        new Promise(resolve =>
            this.getConnection().then(conn =>
                this.debug(sql,args,resolve).then(query =>
                    conn.query(sql, args, ).then(result =>{
                        conn.release();
                        resolve(result[0].insertId);
                    }).catch((error)=> this.handleError(resolve,sql,args,error, conn))
                ))).catch(()=>{null});

    public update = (sql, args = []):Promise<any> =>
        new Promise(resolve =>
            this.getConnection().then(conn =>
                this.debug(sql,args, resolve).then(query =>
                    conn.query(sql, args, ).then(result => {
                        conn.release()
                        resolve(result[0])
                    })
                        .catch((error)=> this.handleError(resolve,sql,args,error ,conn))
                )).catch(()=>resolve({})))

    public delete = (sql, args = []):Promise<any> => this.update(sql, args ).then(d => d.affectedRows >0)

    public getRows = (sql, args = []):any =>
        new Promise(resolve =>
            this.getConnection().then(conn =>
                this.debug(sql,args,resolve)
                    .then(query =>
                        conn.query(sql, args, ).then(result =>{
                            resolve(result[0]);
                            conn.release()
                        })
                            .catch((error)=> this.handleError(resolve,sql,args,error, conn))
                    )).then(()=> resolve([])))

    public getRow = (sql, args = [], _class = null, func = null) :any=>
        new Promise(resolve =>
            this.getConnection().then(conn =>
                this.debug(sql,args,resolve).then(query =>
                    conn.query(sql, args, ).then(result =>{
                        _class? resolve(result[0][0] ? new _class((result[0][0])):null) : func ? resolve(func(result[0][0])) :  resolve(result[0][0])
                        conn.release()
                    }).catch((error)=> this.handleError(resolve,sql,args,error, conn))
                )).catch((e)=>{
                    console.error(e);
                resolve({})
            }))

    public getValue = (sql, args = [], key,fallBack=undefined):Promise<any> =>
        new Promise(resolve =>
            this.getConnection().then(conn =>
                this.debug(sql,args,resolve).then(query =>
                    conn.query(sql, args, ).then(result =>{

                        conn.release();
                        try{
                            result[0].length > 0 ? resolve(result[0][0][key] || fallBack) : resolve(fallBack!==undefined ? fallBack:result[0])
                        }catch (e) {
                            resolve(fallBack!==undefined ? fallBack:result[0])
                        }
                    }).catch((error)=> this.handleError(resolve,sql,args,error, conn)))).catch((e)=>{
                        console.error(e)
                        resolve({});
            }))

    public getLatestId(keyName,tableName,companyIds:any[]){
        if(companyIds.length == 0)return  null;
        return  this.getValue(`select max(${this.escape(keyName)}) + 1 as id from ${this.escape(tableName)} where companyId in (${ Database.arrayToQueryParams( companyIds ) }) `,companyIds,'id',1)
            .then(value => value ? value : 1).catch((e)=>{
                console.log(e,'at DB:getLatestId')
            })

    }

    public keyExists = (key, tableName, fallBack=undefined):Promise<boolean> =>
         <any>new Promise(resolve =>
            this.getConnection()
                .then(conn =>
                   this.debug(
                    `SHOW COLUMNS  FROM ${this.escape(tableName)} WHERE Field = ?`
                    ,[key],resolve).then(query =>
                          conn.query(`SHOW COLUMNS FROM ${this.escape(tableName)} WHERE Field = ?`, [key], ).then(result =>{
                           conn.release();
                        try{result[0].length > 0 ? resolve(true) : resolve(fallBack!==undefined ? fallBack:false)}catch (e) {resolve(fallBack!==undefined ? fallBack:result[0])}
                    }).catch((error)=> this.handleError(resolve,`SHOW COLUMNS FROM ${this.escape(tableName)} WHERE Field = ?`,[key],error, conn))))).catch(()=>{})


    public updateTable  = (tableName, options:any= {} )  =>({
        set:(argName,value,isSecure=false,parseObj=false)=>({

            // wvalue = variables
            // example: v.where(null,[ item.companyId,item.paymentId],'companyId = ? and paymentId = ?').queryOnValue()
            where:(wkey,wvalue,cquery:string = null)=>({
                query:()         =>  this.update(`update ${this.escape(tableName,isSecure)} set ${this.escape(argName,isSecure)} = ? where ${cquery ? this.escape(cquery,isSecure) :this.escape(wkey,isSecure)} = ?`,this.mergeArrayData([parseObj && typeof value === 'object' ? JSON.stringify(value) :value, wvalue])),
                queryOnValue: () =>  (wvalue !== undefined &&value!==undefined)? this.update(`update ${this.escape(tableName,isSecure)} set ${this.escape(argName,isSecure)} = ? where ${cquery ? this.escape(cquery,isSecure) : this.escape(wkey,isSecure)+' = ?'} `, this.mergeArrayData([parseObj && typeof value === 'object' ? JSON.stringify(value) :value,wvalue])):this.returnNull(),
                log: ()          =>  (wvalue !== undefined &&value!==undefined)? console.log(`update ${this.escape(tableName,isSecure)} set ${this.escape(argName,isSecure)} = ? where  ${cquery ? this.escape(cquery,isSecure) : this.escape(wkey,isSecure)+' = ?'}  `,   this.mergeArrayData([parseObj && typeof value === 'object' ? JSON.stringify(value) :value,wvalue ])):this.returnNull()
            }),
            query:()=>this.update(`update ${this.escape(tableName)} set ${this.escape(argName)} = ?`,[parseObj && typeof value === 'object' ? JSON.stringify(value) :value])
        })
    })

    public escape(v,isSecure=false){

        if(v === null)return null

        if ( !v || isSecure) return v;
        const mysqlStsCmds = ['insert','update','delete','patch',"'",'"','`','#', 'drop']
        try{
            mysqlStsCmds.forEach(word => {
                while(v && (v+'').toLowerCase().includes(word)){
                    v = v.toLowerCase().replace(word,'')
                }
            })
        }catch (error) {
            console.log(v,this.query,error)
            v = '';
        }

        return v
    }

    public createLimit(idx,size,reduceByOne=true){
        return ` limit ${ ((idx>0 && reduceByOne)?idx-1: idx)*size} , ${size}`;
    }

    public mergeArrayData(data){
        let array = []

        for(let i = 0; i<data.length;i++){
            if(typeof data[i] === 'object' && Array.isArray(data[i]) && data[i]){
                array.push(... data[i])
            }
            else array.push(data[i])
        }

        return array
    }

    private returnNull = ()=> new Promise(resolve => resolve(null))

    static arrayToQueryParams(array){
        let string = '';
        array.forEach((val,idx)=> {
            string += ('?,');
        })
        return string.substring(0,string.length-1)
    }


}

// Functions
function getSingleton(foreceNew = false) {
  if(process[db_config.app_name] && !foreceNew) return process[db_config.app_name];
  else{
      db_config['waitForConnections']    = true;
      db_config['connectionLimit']       = 2;

      let data = JSON.parse(JSON.stringify(db_config));
      delete data.companyName
      delete data.name
      delete data.app_name
      process[db_config.app_name] =  mysql2.createPool(data);
  }
  return process[db_config.app_name];
}


