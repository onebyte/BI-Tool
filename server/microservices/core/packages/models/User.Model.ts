import BaseModel from "./Base.Model";
import Database from "../database/Connection";
import {cryptoUtils} from "../utils/crypto/crypto.utils";
import {Mailer} from "../module/mail/Mail.Send.Class";

export class User extends BaseModel{

    host
    userId
    externId
    externType
    email
    fallBackEmail
    usernameHash
    password
    pwChangedAt
    loginAttempt
    oauth2
    color



    profileImage
    firstName
    lastName

    assignedCompanyId
    company:any // companyObj


    emailIsVerified():boolean{
        return true
    }

    licenceIsConfirmed():boolean{
        return true
    }

}

export class AuthUser extends User {

    public appAccess = []

    protected _tableName  = 'Auth_User';

    protected _primaryKey = 'userId';

    protected _fillable = [
        'color',
        'externId',
        'email',
        'host',
        'password',
        'externType',
        'gender',
        'lastName',
        'firstName'
    ]

    protected login = new AuthLogin(this,this.db);

    constructor(data = null) {
        super();
        if(data)this.initialiseData(data)
    }

    initialiseData(data, secure: boolean = true): this {
        super.initialiseData(data,secure);
        if(this.email && !this.host)this.host = AuthLogin.getHost(this.email)

        return this;
    }

    doLogin(email:string,password:string,uuId:string,ip:string):Promise<any>{
        return this.login.doLogin(email, password, uuId, ip);
    }

    doLogout (uId:number,tk:string):Promise<any>{
        return this.login.doLogout(uId, tk)
    }

    doSessionCheck(uuId:string,accessToken:string, email:string,encrypted = false){

        if(encrypted){
            try{email = cryptoUtils.decrypt(email,'email')}catch (e){}
        }

        return this.login.doSessionCheck(uuId,accessToken,email)
    }



    verifyPasswordResetByCode(code){
        return  this.login.verifyPasswordResetByCode(code)
    }

    resetUserPassword(){
        return this.login.resetUserPassword()
    }

    changeUserPassword(password,code){
        return this.login.changeUserPassword(password,code)
    }

    isLoggedIn(){

    }

    getAssignedCompanyInfos(){
        return this.db.getRow('select * from COM_Company where companyId',[
            this.assignedCompanyId
        ])
    }

    static getUserByExternId(externId,type){
        return AuthUser.getDB().getRow('select * from Auth_User where  externType = ? and externId = ? ', [type,externId])

    }

}

export class UserHandler{

    db:Database = new Database();

    table = 'Auth_User'

    primaryKey = 'userId'



    constructor(params = null) {
    }


    getUserFromCompany(userId,companyId){
        return this.getUsersFromCompany(companyId)
    }

    getUsersFromCompany(companyId ){
        let select = [
            "userId",
            "externType",
            "email",
            "color",
            "enabled",
            "gender",
            "firstName",
            "lastName",
            "profileImage",
        ]
        return this.db.getRows(`select ${select.join(',')} from Auth_User where assignedCompanyId = 1 and deleted is null`)
    }

    updateUserKey(id,key,value){
     if( !key ) return new Promise(resolve=>resolve(false));
      return this.db.keyExists(key,this.table)
            .then(exists => exists ?
                this.db.updateTable(this.table).set(key,value).where(this.primaryKey,id).queryOnValue()
                    .then(result => result ? result.affectedRows : null)
        :null)
    }


}

class AuthLogin{

    constructor(private authUser:AuthUser,private db:Database) {}

    public doSessionCheck(uuId:string,accessToken:string, email:string){

        return new Promise(async resolve => {

            if(!accessToken || accessToken.length < 50 ){
                return resolve(null)
            }



            let userToken     = AuthLogin.resolveAccessToken(accessToken,email);

            let queryParams = [userToken[1],AuthLogin.getHost(userToken[0]),userToken[0],userToken[2]]
            let user      = await this.db.getRow(`select * from Auth_User AU
                                                                    left join Auth_Login AL on 
                                                                        (
                                                                         (AU.authCreatedAt = AL.authCreatedAt) and (AU.userId = AL.userId)
                                                                        ) where   AU.authCreatedAt = ? and  AU.host = ? and AU.email = ? and AL.accessToken = ? and AU.enabled limit 1`,queryParams)

            /*select from com role*/



            if(user)
            user.appAccess   = await this.db.getRows(`select R.roleId, R.appId, R.access from APP_Rights R
                                                                                        left join APP_UserRights  UR on
                                                (R.companyId = UR.companyId and R.roleId = UR.roleId)
                                                                                        where
                                                                                        UR.companyId = ? and UR.userId = ?`,[ user.assignedCompanyId, user.userId ])

            if(user && user.userId>0) {
                delete user.password;
                this.authUser.initialiseData(user,false);
                if(true){
                    const company = await this.authUser.getAssignedCompanyInfos()
                    user.company = {
                        logo:company.logo,
                        fullName:company.fullName,
                        id:company.companyId,
                    }
                }
            }

            resolve(user && user.userId);
        })
    }

    public doLogin(email:string,password:string,uuId:string,ip:string):Promise<any>{
        return new Promise(async (resolve) => {

            let userParam = [AuthLogin.getHost(email),email];
            let user      = await this.db.getRow(`select * from Auth_User where  host = ? and email = ? and ( password = ? or password = '****') and deleted is null limit 1`,[...userParam, password]);

            // No User Found
            if(!user  || !user.userId) {
                this.db.update(`update Auth_User set loginAttempt = loginAttempt+1 where host = ? and email = ?`,userParam);
                return resolve( {state:0})
            }

            // User is disabled
            if(user.deleted || !user.enabled || user.loginAttempt > 50){
                // blocked -2 / disabled -1

                if(user.loginAttempt>=50){
                    setTimeout(()=>{
                        this.db.update(`update Auth_User set loginAttempt = 0 where host = ? and email = ?`,userParam)
                    },(300000)*3); // 5*3 minutes
                }
                this.db.update(`update Auth_User set loginAttempt = loginAttempt+1 where host = ? and email = ?`,userParam)


                return resolve( {state: user.loginAttempt >= 50 ? -2 : -1})
            }


            // -------------------------- SUCCESS Login
            let req = {state:<any>true,confirmKey:null,userId: user.userId}


            if(user.resetPassword || user.password === '****'){
                const resetLink     = AuthLogin.makeid(90, true);
                let tableName       = 'Auth_User'
                setTimeout(()=> this.authUser.updateKey('resetLink', null, tableName,userParam, ' host = ? and email = ?'),1800000); // 30Minutes
                setTimeout(()=> this.authUser.updateKey('resetLink', resetLink, tableName ,userParam, ' host = ? and email = ?'),     0); // Now
                return  resolve({
                    path:'/auth/reset',
                    pathParams:{
                        resetLink:resetLink
                    },
                    user: {
                        id:user.userId,
                    }
                });
            }

            if(!this.authUser.emailIsVerified()     && false){
                req = ({state:1,userId:user.userId,confirmKey:'???'});
            }
            if(!this.authUser.licenceIsConfirmed()  && false ){
                req = ({state:2,userId:user.userId,confirmKey:null});
            }

            let  userToken  = AuthLogin.makeid(45,false).replace(/:/g,'');
            let accessToken = AuthLogin.createAccessToken(email, user.authCreatedAt+'', userToken, (user.assignedCompanyId));

            // update users
            this.db.insert('insert into Auth_Login  (ip,userId,authCreatedAt,uuId,accessToken) values (?,?,?,?,?)  ON DUPLICATE KEY UPDATE accessToken = ?; ',[
                ip ,user.userId, user.authCreatedAt, uuId , userToken, userToken,
            ])


            this.authUser.initialiseData(user,false);
            const company = await this.authUser.getAssignedCompanyInfos();
            user.company = {
                logo:    company.logo,
                fullName:company.fullName,
                id:      company.companyId,
            }

            resolve({
                state:req.state,
                confirmKey:req.confirmKey,
                user: {
                    valid:            req.state === true,
                    id:               user.userId,
                    accessToken:      accessToken,
                    firstName:        user.firstName,
                    lastName:         user.lastName,
                    email:            user.email,
                    profileImage:     user.profileImage,
                    company:          user.company,
                    assignedCompanyId:user.assignedCompanyId,
                }
            });

            this.db.update(`update Auth_User set loginAttempt = 0 where host = ? and email = ?`,[...userParam])

        })
    }

    public doLogout (uId:number, tk:string):Promise<any>{
        return  this.db.delete(`delete from auth_login where uuId = ? and accessToken = ? `,[uId,tk])
    }

    public verifyPasswordResetByCode(code:string,email = this.authUser.email){
        return new Promise(async resolve => {

            if(!email)return resolve(0);

            let target    = [ AuthLogin.getHost(email) , email , code];


            let user = await this.db.getRow(`select * from Auth_User where  host = ? and email = ? and resetLink = ? limit 1`,target)
            if(!user) {
                return resolve(0);
            }

            this.authUser.initialiseData(user);


            /**
             * if code is valid
             * set db can change password for 30minutes
             * send routing path back
             * */
            if(user){
                return resolve({
                    path:'/auth/reset',
                    pathParams:{
                        token:''
                    },
                    user: {
                        id:user.userId,
                    }
                });
            }

            /**
             * if code is not correct
             * increase attempt
             * restrict
             * TODO
             * */
            resolve(0)
        })
    }

    public resetUserPassword(){
        return new Promise(async resolve => {

            let target    = [ AuthLogin.getHost(this.authUser.email) , this.authUser.email ];
            let whereStmt = ' host = ? and email = ? limit 1';

            let user      = await this.db.getRow(`select * from Auth_User where host = ? and email = ? limit 1`,target)
            if(!user) {
                return resolve(0);
            }

            // create reset Link
            const resetLink     = AuthLogin.makeid(90, true)
            setTimeout(()=> this.authUser.updateKey('resetLink', null, 'Auth_User',target,whereStmt),1800000); // 30Minutes
            setTimeout(()=> this.authUser.updateKey('resetLink', resetLink, 'Auth_User' ,target,whereStmt),     0); // Now
            this.sendEmailPasswordResetLink(resetLink,user.email)

            // send reset Link
            return resolve(resetLink);

        })
    }

    public changeUserPassword(newPassword:string,code:string){

        // update loginAttempt
        // update lastPasswordChangedAt
        // set new Password
        // redirect to login page

        return new Promise(async resolve => {

            if(code == '-1') return resolve(false)

            let target    = [ AuthLogin.getHost(this.authUser.email) , this.authUser.email , code];

            await this.authUser.updateKey('password', newPassword, 'Auth_User' ,target, 'host = ? and email = ? and resetLink = ?')

            // verify by loading user
            target    = [ AuthLogin.getHost(this.authUser.email) , this.authUser.email , newPassword];


            let user  = await this.db.getRow(`select * from Auth_User where  host = ? and email = ? and password = ? limit 1`,target)

            if(user){
                resolve(true);
                this.authUser.updateKey('resetLink', null, 'Auth_User' ,[ AuthLogin.getHost(this.authUser.email) , this.authUser.email], ' host = ? and email = ? ')
                return console.log('success-true') //this.sendPasswordChangedNotification()
            }

            resolve(false);

        })


    }

    sendEmailPasswordResetLink(resetLink,email){
       return  new Mailer.Mail().sendEmail(email, 'Password zurücksetzten', process.env.APP_URL + `/authentication/reset/`+email+'/'+resetLink);
        return new Promise(async resolve => {
            /*
              let template   = await templater.loadTemplate('file','auth/auth.reset.html', 'DE')

            template.html   =  templater.parseDefaultValues(template.html,
                {TITLE:'Password zurücksetzten',
                    BUTTONTEXT:'Zurücksetzten',
                    LINK:
                        `http://localhost:4200/auth/forgot/`+this.email+'/'+resetLink
                    , RECEIVERMAIL:email,CODE:resetLink})
            * */
        });
    }

    //

    static createAccessToken(email,authCreatedAt,token,companyId):string{
        return cryptoUtils.encrypt(email+':'+authCreatedAt+':'+token+ ':'+ (companyId),email)
    }

    static resolveAccessToken(accessToken,email):string{
        return (cryptoUtils.decrypt(accessToken,email) || '').split(':')
    }

    static usernameExists(host:string, username:string, db:Database){
        return new Promise((resolve)=>{
            if(username){
                db.getValue('select userId from Auth_User where host = ? and email = ? ',[host,username],'userId',null)
                    .then((userId)=> resolve(!userId))
            }else  resolve(false)
        })
    }

    static hashUsername(email:string){
        return email.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)
    }

    static getHost(email:string){
        return email.slice(email.lastIndexOf('@')+1);
    }

    static makeid(length,simple = false) {
        var result           = '';
        var characters       = simple ? 'abcdefghijklw123445_6789' :'+ABC4!DEFGHIJKL+MNOPQRSTUVW$XYZabcde@fghijklmnopqrstuvwxyz0123456789+C';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

}