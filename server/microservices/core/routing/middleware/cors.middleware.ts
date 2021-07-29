import MiddlewareBase from "./base.middleware";
import {NextFunction, Request, Response} from "express";

export default class CorsMiddleware extends MiddlewareBase {

        readonly allowedMethods = [
            "OPTIONS",
            "POST",
            "GET",
            "PUT",
            "DELETE",
            "PATCH"
        ]

        readonly allowedFields  = [
            "Authorization",
            "Content-Type",
            "ptk"
        ]

        constructor(protected req:Request, protected res:Response, protected next:NextFunction,protected routes:any[]) {
            super(req, res, next,routes)
        }

        getAllowedOrigin():string{
            return process.env.ACCESS_CONTROL_ORIGIN || '';
        }

        register():boolean{

            this.res.setHeader('Access-Control-Allow-Origin', this.getAllowedOrigin());

            this.res.header('Access-Control-Allow-Methods' ,   this.allowedMethods.join(','));

            this.res.header('Access-Control-Allow-Headers' ,   this.allowedFields.join(','));


            this.res.header('Referrer-Policy', 'same-origin');

            // Allow-Credentials is set to true because we want to use cookies
            this.res.header('Access-Control-Allow-Credentials', "true");

            if(this.getURL().includes('/v1/')){
                this.res.header('Cache-Control', 'no-store')
            }
            else {
                this.res.header('Cache-Control', 'max-age=172800'); // 2 days
            }

            if(this.req.method == 'OPTIONS'){
                this.res.sendStatus(200);
                return false
            }

            return true;
        }

}
