import {Router} from "express";
import {IResponse} from "../../../../../core/routing/core/response";
import {IRequest} from "../../../../../core/routing/core/request";
import {Routing} from "../../../../../core/routing/core/Routing.Core";
import {cryptoUtils} from "../../../../../core/packages/utils/crypto/crypto.utils";
import {rejects} from "assert";

/**
 * AuthAPI
 */
export const  AuthAPI = (AuthAPI:Router = Router() , cb = null) => {

    const maxDays           = 30 * 6;
    const dayTs             = 86400000;


    const uuIdUtils = {
        tableName:'Auth_UuId_Reset', // todo rename
        add:async (req:IRequest,res:IResponse,uuId:string)=>{
            await req.getDB().insert(` CREATE TEMPORARY TABLE if not exists Auth_UuId_Reset (  uuId varchar(100) );`);
            await req.getDB().insert(` CREATE TEMPORARY TABLE if not exists Auth_UuId_Reset (  uuId varchar(100) );`);
            await req.getDB().insert(` insert into Auth_UuId_Reset  (uuId) values (?)`,[uuId]);
        },
        delete:async  (req,res,uuId:string)=>{
            await req.getDB().insert(` CREATE TEMPORARY TABLE if not exists Auth_UuId_Reset (  uuId varchar(100) );`);
            await req.getDB().insert(` CREATE TEMPORARY TABLE if not exists Auth_UuId_Reset (  uuId varchar(100) );`);
             req.getDB().delete(` delete from Auth_UuId_Reset where uuId = ? limit 1`,[uuId]);
        },
        verify : (req,res,uuId)=> new Promise(async resolve => {
            await req.getDB().insert(` CREATE TEMPORARY TABLE if not exists Auth_UuId_Reset (  uuId varchar(100) );`);
            await req.getDB().insert(` CREATE TEMPORARY TABLE if not exists Auth_UuId_Reset (  uuId varchar(100) );`);
            req.getDB().getValue(` select *  from Auth_UuId_Reset where uuId = ? limit 1`,[uuId],'uuId')
                .then(id => {
                    if(id === uuId)resolve(true)
                    else resolve(false)
                });
        }),
        logAll: async (req,res)=>{
            await req.getDB().insert(` CREATE TEMPORARY TABLE if not exists Auth_UuId_Reset (  uuId varchar(100) );`);
            return req.getDB().getRows(` select *  from Auth_UuId_Reset `)
                .then(console.log);
        }
    };

    /**
     * Extend Request by <IAuthRequest>
     * */
    interface IAuthRequest extends  IRequest {
        user: {
            email:      string,
            password:   string,
            accessToken:string,
            username:   string,
            emailHash:  string,
            uuId?:              string
            assignedCompanyId?: string
        }
    }

    //AuthAPI.use('/' , Routing.registerUtility({}));

    /**
     * @swagger
     * definitions:
     *   Login:
     *     required:
     *       - email
     *       - password
     *       - uuId
     *     properties:
     *       email:
     *         type: string
     *       password:
     *         type: string
     *       uuId:
     *         type: string
     *       path:
     *         type: string
     */

    /**
     * @swagger
     * tags:
     *   name: Auth
     *   description: Login Management
     */

    /**
     * @swagger
     * /auth/signin:
     *   post:
     *     description: Login to the application
     *     tags: [Auth]
     *     produces:
     *       - application/json
     *     parameters:
     *       - $ref: '#/parameters/username'
     *       - name: password
     *         description: User's password.
     *         in: formData
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: login
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Login'
     */
    AuthAPI.post('/signin',          (req: IAuthRequest , res: IResponse) => {

        if (!req.user.email) return res.sendStatus(401).send();

        res.promiseAndSend(
            new Promise((resolve, reject) => {
            req.getUser().doLogin(
                req.user.email,
                req.body.user.password,
                req.body.user.uuId,
                req.getIP(req))
                .then((data) => {

                    /**Username is disabled*/
                    if (data.state < 0) {
                        res.cookie('uuId', {maxAge: 0})
                        res.clearCookie('utk')
                        res.clearCookie('uuId')
                        return reject({
                            status: 401,
                            code: 'auth',
                            message: data.state === -1 ? 'userdisabled' : 'userblocked'
                        })
                    }

                    /**Username is invalid*/
                    if (data.state === 0) {
                        res.cookie('uuId', {maxAge: 0})
                        res.clearCookie('utk')
                        res.clearCookie('uuId')
                        return reject({
                            status: 401,
                            code: 'auth',
                            message: 'usernameorpasswordinvalid'
                        })
                    }

                    /** Success */
                    req.user.accessToken       = data.user.accessToken;
                    req.user.assignedCompanyId = data.user.assignedCompanyId;

                    delete data.user.accessToken;

                    // User needs to confirm email
                    if (data.state === 1) {
                        return resolve({
                            data: data.id,
                            status: 200,
                            message: 'confirmemail',
                            confirmKey: data.confirmKey
                        })
                    }

                    // Confirm licence
                    if (data.state === 2) {
                        return resolve({
                            data: data.id,
                            status: 200,
                            message: 'confirmlicence',
                            confirmKey: data.confirmKey
                        })
                    }

                    /**
                     if(user.auth.tfa){ }
                     **/

                    return resolve(data);

                })
        }),
            {cookies: [
                {
                    name: 'utk',
                    value: () => req['user']['accessToken'],
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: true, path: '/'}
                },
                {
                    name: 'uuId',
                    value: () => req.body.user.uuId,
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: false, path: '/'}
                },
                {
                    name: 'eId',
                    value: () => cryptoUtils.encrypt(req.user.email, 'email'),
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: true, path: '/'}
                },
                {
                    name: 'cId',
                    value: () => cryptoUtils.encrypt(req.user.assignedCompanyId + '', (process.env.APP_NAME||'company')),
                    options: {expires: new Date(Date.now() + (maxDays * dayTs)), httpOnly: true, path: '/'}
                },
            ]});
    })

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     description: Logout to the application
     *     tags: [Auth]
     *     produces:
     *       - application/json
     *     parameters:
     *       - $ref: '#/parameters/username'
     *       - name: password
     *         description: User's password.
     *         in: formData
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: login
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Login'
     */
    AuthAPI.delete('/signout',          (req: IAuthRequest, res: IResponse) =>  {

        req.getUser().doLogout( req.getCookie('uId') , req.getCookie('utk'),  cryptoUtils.decrypt(req.getCookie('eId'),'email'));
        ['utk','uuId','eId','cId'].forEach(id => res.cookie(id,0,{maxAge:  Date.now()}));
        res.sendAnswer(res,<any>{},200);
    });

    /**
     * @swagger
     * /auth/session:
     *   post:
     *     description: verify usersession
     *     tags: [Auth]
     *     produces:
     *       - application/json
     *     parameters:
     *       - $ref: '#/parameters/username'
     *       - name: password
     *         description: User's password.
     *         in: formData
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: login
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Login'
     */
    AuthAPI.post('/session',         (req: IAuthRequest, res: IResponse) => {
        const {  uuId } =  req.getDefaultParameter();
        const end       = () =>  {
            ['utk','uuId','eId','cId'].forEach(id => res.cookie(id,0,{maxAge:  Date.now()}));
            req['kill'] = true;
            res.sendAnswer(res,<any>{valid:false},401,{reload:true})
        }


        if(uuId !== req.getCookie('uuId',true)) return end();

        if(!uuId || !req.getCookie('utk',true))return end();

        if(!req.getCookie('eId'))return end();

        req.getUser().doSessionCheck(req.getCookie('uuId'), req.getCookie('utk',true), cryptoUtils.decrypt(req.getCookie('eId'),'email'))
            .then((row) => {
                if( !row ) return end();
                const user = req.getUser();
                res.sendAnswer(res,<any>{ valid: true ,
                    user:{
                        company:        user.company,
                        email:          user.email,
                        profileImage:   user.profileImage,
                        firstName:      user.firstName,
                        lastName:       user.lastName,
                    }, path:{desktop:'/'}},200)
            }).catch(() => end());
    });

    /**
     * @swagger
     * /auth/register:
     *   post:
     *     description: Register for the application
     *     tags: [Auth]
     *     produces:
     *       - application/json
     *     parameters:
     *       - $ref: '#/parameters/email'
     *       - name: password
     *         description: User's password.
     *         in: formData
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: login
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Login'
     */
    AuthAPI.post('/register',        (req: IAuthRequest , res: IResponse) => {
        /**
         const EResult = {
            UserExits:-1,
            Failed:null
        }

         req.getUser().createUser(req.getDefaultParameter())
         .then((result:any) => {
                if ( EResult.UserExits === result ) {
                   return res.sendAnswer(res, <any>-1,200);
                }
                res.sendAnswer(res, result ,200);
            });
         * */
    });

    /**
     * @swagger
     * /auth/forgott:
     *   post:
     *     description: Get code for reseting password
     *     tags: [Auth]
     *     produces:
     *       - application/json
     *     parameters:
     *       - $ref: '#/parameters/email'
     *       - name: emailaddress
     *         description: Email of requested user.
     *         in: Encripted
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: login
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Login'
     */
    AuthAPI.post('/forgot',          (req: IAuthRequest , res: IResponse) => {

        // Reset
        res.cookie('uuId', {maxAge: 0})
        res.clearCookie('utk')
        res.clearCookie('eId')
        res.clearCookie('uuId')

        // todo add email here

        const { code , uuId } = req.getDefaultParameter();

        let task = code ? req.getUser().verifyPasswordResetByCode(code) : req.getUser().resetUserPassword();

        task.then((result:any)=>{
            if(result.user && result.user.id){
                uuIdUtils.add(req,res,uuId)
                setTimeout(()=>
                    uuIdUtils.delete(req,res,uuId)
                ,300000)
                return res.sendAnswer(res, result,200)
            }
            res.sendAnswer(res, <any>false,200)
        });

    });

    /**
     * @swagger
     * /auth/reset:
     *   post:
     *     description: reset Password
     *     tags: [Auth]
     *     produces:
     *       - application/json
     *     parameters:
     *       - $ref: '#/parameters/email'
     *       - name: emailaddress
     *         description: Email of requested user.
     *         in: Encripted
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: login
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Login'
     */
    AuthAPI.post('/reset',           (req: IAuthRequest , res: IResponse) => {
        const { code ,uuId } = req.getDefaultParameter();
        (async ()=> {
            if(await uuIdUtils.verify(req,res,uuId))
            req.getUser().changeUserPassword(req.user.password,code)
                .then((changed)=>res.sendAnswer(res,<any>{state:changed,success:1},200));
            else res.sendAnswer(res,<any>{state:-1,message:'uuId not found'},200)
        })();

    });

    /**
     * @swagger
     * /auth/verfyemail:
     *   post:
     *     description: Verify Email from User
     *     tags: [Auth]
     *     produces:
     *       - application/json
     *     parameters:
     *       - $ref: '#/parameters/email'
     *       - name: emailaddress
     *         description: Email of requested user.
     *         in: Encripted
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: login
     *         schema:
     *           type: object
     *           $ref: '#/definitions/Login'
     */
    AuthAPI.post('/verify-email',     (req: IAuthRequest , res: IResponse) => {
        /**
         const {  key } = req.getDefaultParameter();

         req.getUser().doSessionCheck(req.getCookie('uuId'), req.getCookie('utk',true), req.getCookie('email',true))
         .then((row)=>{
                if( !row ) return res.sendAnswer(res,<any>{},400);
                req.getUser().verifyEmail(key)
                    .then(id=> res.sendAnswer(res,<any>{ valid: true , user:{id:id}},id ? 200 :400))
            })
         * */
    });


    if(cb) cb(AuthAPI);

    return AuthAPI;
};
