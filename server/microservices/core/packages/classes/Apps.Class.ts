import {BaseClass} from "./Base.Class";

class AppRole extends BaseClass {

    roleId:any

    companyId:any

    loginFrom:any

    loginTill:any

    enabled:boolean

    name:string

    type:'domain'|'group'|'global'

    apps?:number[];

    users?:number[];

    constructor(params = {}) {
        super()
        if(params) this.initialiseData(params)
    }

    public getUserRoles(){
        return this.db.getRows(`
      select R.name ,   R.roleId,
       group_concat(distinct AR.appId)  as apps,
       group_concat(distinct UR.userId) as users,
       group_concat(distinct CONCAT(U.firstName,' ',U.lastName)) as name
        from APP_Role R
        left join APP_Rights     AR on R.roleId = AR.roleId
        left join APP_UserRights UR on R.roleId = UR.roleId
         LEFT JOIN Auth_User as U
          ON UR.userId = U.userId where R.companyId = ?  group by R.roleId;
        `,[this.companyId])
            .then(data=>{
                return data.map(values=>{
                    if(values.apps)  values.apps = values.apps.split(',').map(v=>+v)
                    if(values.users)  values.users = values.users.split(',').map(v=>+v)
                    return values
                })
            })
    }

    public getCompanyRoles(){
        return this.db.getRows(`select R.name, R.roleId,
         group_concat( distinct UR.companyId) as companies,
         group_concat( distinct C.fullName) as companyNames
         from COM_Role R
           left join COM_Rights UR on R.roleId = UR.roleId
           left join COM_Company C on C.companyId = UR.companyId
         where R.companyId = ?`,[this.companyId])
    }

    public save(){
        const role = this;
        return new Promise(async resolve => {
            if(!role.companyId)role.companyId = this.companyId
            if(!role || !role.companyId) return resolve(null)

            if(!role.roleId) role.roleId = await this.db.insert(`insert into APP_Role (name,companyId) values (?,?)`,[role.name,role.companyId])

            if(role.roleId){
                this.db.update(`update APP_Role set name = ?        where roleId = ?`,[role.name,role.roleId])
                this.db.update(`update APP_Role set enabled = ? where roleId = ?`,[(<any>role.enabled)>0?1:0,role.roleId])
                this.db.update(`update APP_Role set type = ?        where roleId = ?`,[role.type,role.roleId]);


                if(role.loginTill) this.db.update(`update APP_Role set loginTill = ? where roleId = ?`,[role.loginTill,role.roleId])
                else this.db.update(`update APP_Role set loginTill = null where roleId = ?`,[role.roleId])

                if(role.loginFrom ) this.db.update(`update APP_Role set loginFrom = ? where roleId = ?`,[role.loginFrom,role.roleId])
                else this.db.update(`update APP_Role set loginFrom =  null where roleId = ?`,[role.roleId])
            }

            await this.db.update('delete from APP_UserRights where roleId = ? ',[role.roleId])
            await this.db.update('delete from APP_Rights     where roleId = ? ',[role.roleId])

            if(typeof role.apps == 'object'){
                role.apps.map((v:any)=> this.db.insert('insert into APP_Rights (appId,roleId,access,companyId) values (? ,?, ?,?)',[v.appId,role.roleId,v.access,role.companyId]))
            }
            if(typeof role.users == 'object'){
                role.users.map(v=> this.db.insert('insert into APP_UserRights (userId,roleId,companyId) values (? , ?,?)',[v,role.roleId,role.companyId]))
            }

            resolve(role.roleId)
        })
    }

    // delete
    public deleteCompanyRole(){
        return this.db.update('delete from COM_Role where roleId = ? and companyId = ?',[this.roleId, this.companyId])
    }

    public deleteUserRole(){

        return this.db.update('delete from APP_Role where roleId = ? and companyId = ?',[this.roleId,this.companyId])
    }


}

export class AppsHandler extends BaseClass {

    constructor() {
        super();
    }

    /**
     * @param userId
     * @param companyId
     * */
    public getRolesFromCompany(companyId){
        return this.db.getRows(
            `select A.roleId,A.name,A.enabled,
       group_concat(DISTINCT appId) as apps,
       group_concat(DISTINCT  userId) as users
       from APP_Role A
left join APP_Rights AR on  A.companyId = AR.companyId and A.roleId = AR.roleId
left join APP_UserRights UR on  A.companyId = UR.companyId and A.roleId = UR.roleId
where A.companyId group by A.roleId,A.name, A.companyId,A.enabled`,[companyId]
        )
    }

    public getRoleFromCompany(roleId,companyId){
        return Promise.all([
            this.db.getRow(`select * from APP_Role where companyId = ? and roleId = ?`,[companyId,roleId]),
            this.db.getRows(`select appId,access from APP_Rights where companyId = ? and roleId = ?`,[companyId,roleId]),
            this.db.getRows(`select userId from APP_UserRights where companyId = ? and roleId = ?`,[companyId,roleId])
        ]).then(rows => {
            return {
                role: rows[0],
                apps: rows[1],
                users:rows[2].map(v => v.userId),
            }
        })
    }

    public getAllApps(companyId:number,options:{categoryName?:boolean} = {}){

        if(options){

            if(options.categoryName){
                return this.db.getRows(
                    `select appId,APP_Apps.title,APP_Apps.categoryId ,
                            AC.title as categoryName
                     from APP_Apps
                              left join APP_Categories AC on
                             AC.categoryId = APP_Apps.categoryId
                             and (AC.companyId = APP_Apps.companyId
                             or (APP_Apps.companyId is null))
                     where APP_Apps.companyId = ? or 
                         APP_Apps.companyId is null order by AC.title, APP_Apps.title `,
                    [companyId]
                )
            }

        }

        return this.db.getRows(
            `select appId,title,categoryId from APP_Apps where companyId = ? or companyId is null `,
            [companyId]
        )
    }

    public getAppsFromUser(userId:number,companyId:number, grouped = false){
        return new Promise(async resolve => {

            let apps:{
                title:string,
                base: string,
                img:'',
                children:any[],
                appId:number,
                catId?:number
            }[] = [];

            let params = [companyId,companyId,userId]
            let rows = await this.db.getRows(` select
                                  A.appId,
                                  A.title as appTitle,
                                  AC.title as catTitle,
                                  AC.linkCategoryId,
                                  AC.categoryId,
                                  A.path as appPath,
                                  AC.path as catPath,
                                  A.subCategory1 as lv1,
                                  A.subCategory2 as lv2,
                                  A.subCategory3 as lv3
                              from APP_Apps A
                                       right join APP_Categories AC on
                                  (
                                          (A.companyId = AC.companyId) or ( A.categoryId = AC.categoryId and A.companyId is null  and AC.companyId is null )
                                      )
                              where A.appId in (
                                  select appId
                                  from APP_Rights
                                  where companyId = ? and roleId in (
                                      select roleId
                                      from APP_UserRights
                                      where companyId = ? and userId = ?
                                  )
                              )`,params)

            if(grouped){
                //
                const findNodeByIdAndTitle = (nodes, id , catTitle) => {
                    let res;

                    function findNode(nodes, id, catTitle) {
                        for (let i = 0; i < nodes.length; i++) {

                            if (nodes[i].lv === id && (!catTitle || (nodes[i].catTitle || nodes[i].title)== catTitle)) {
                                res = nodes[i];
                                 // callback(nodes[i]);
                                break;
                            }
                            if (nodes[i].children) {
                                findNode(nodes[i].children, id,catTitle);
                            }
                        }
                    }

                    findNode(nodes, id, catTitle)

                    return res;
                }
                const createMenuBaseObject = (row,lv=0) => {
                    return  {
                        catId:row.categoryId || row.catId,
                        title:row.catTitle,
                        base: row.catPath,
                        img:'',
                        lv:lv,
                        children:row.children || []
                    }
                }
                const createMenuObject     = row => {
                    return {
                        id:row.appId,
                        title:row.appTitle,
                        path:row.appPath,
                        img:row.img,
                        base:row.catPath,
                        version:row.version
                    }
                }

                // Fill categories
                let baseItems = rows.filter(row => !row.linkcategoryid).map(createMenuBaseObject)
                // filter save unique ones
                 baseItems.forEach(item =>{
                    if(!apps.find(_item=>_item.base === item.base))apps.push(item)
                })


                // fill childrens
                apps = apps.map(cat => {
                    let child = rows.filter(app => app.categoryId == cat.catId)
                    child.forEach(app => {
                        if(app.lv3){}
                        else if(app.lv2){}
                        else if(app.lv1){
                            let lv = 1;
                            let childCat = findNodeByIdAndTitle(cat.children,1,app.lv1);

                            if(!childCat) {
                                childCat = {
                                    catTitle:app.lv1,
                                    base:'',
                                    children:[]
                                };
                                cat.children.push(createMenuBaseObject(childCat, lv));
                            }
                            childCat.children.push(createMenuObject(app));
                        }
                        else {
                            cat.children.push((createMenuObject(app)))
                        }
                    });
                    return cat
                });

                return resolve(apps);

            }
            return resolve(apps)

        })
    }

    public addRole(role:AppRole){
       return new AppRole(role).save()
    }

    public deleteRole(roleId,companyId){
       return  new AppRole({companyId,roleId}).deleteUserRole()
    }

}



