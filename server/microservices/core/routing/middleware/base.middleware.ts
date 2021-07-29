import {NextFunction,Request,Response} from "express";

export default abstract class MiddlewareBase{

    constructor(protected req:Request, protected res:Response, protected next:NextFunction,protected routes:any[]) {}

    protected getOrigin():string{
        return this.req.get('origin') || this.req.get('host')
    }

    protected getMethod():string{
        return this.req.method;
    }

    protected getIP():string{
        return this.req.headers['x-forwarded-for'] || <any>this.req.socket.remoteAddress
    }

    protected getURL():string{
        return this.req.originalUrl;
    }

    abstract  register():boolean | Promise<boolean>
}