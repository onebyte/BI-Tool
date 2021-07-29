import Database from "../database/Connection";


export class BaseClass {
    protected readonly db:Database = new Database();

    public initialiseData(data, secure = true):this{
        if(!data)return this;
        Object.assign(this,data)
        return this;
    }
}
