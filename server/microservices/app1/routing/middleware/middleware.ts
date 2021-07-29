import MiddlewareBase from "../../../core/routing/middleware/base.middleware";
import {Routing} from "../../../core/routing/core/Routing.Core";
import AuthMiddleware from "../../../core/routing/middleware/auth.middleware";

export class AuthMiddleWare extends Routing.MiddleWare{

    protected readonly middleWares = (req,res,next,routes) : MiddlewareBase[] => [
        new AuthMiddleware(req,res,next,routes),
    ];

    constructor(protected express) {
        super(express)
    }

}