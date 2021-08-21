import Database from "../../database/Connection";

interface ITask {
    // ref to Company
    companyId:number;

    // unique (companyId,taskName)
    taskName:string;
}


export class CronTaskHandler {

    protected db:Database = new Database();

    protected _tableName = 'CON_Tasks';

    private tasks:ITask[];

    /*
     * Get all jobs/tasks from Database
     * */
    public async loadTasks():Promise<this>{
       return this.db.getRows(`
            select distinct * from ${this._tableName} where enabled`, //  order by companyId
            ).then(tasks => this.tasks = tasks)
           .then( ()=> this);
    }

    /*
    * Sets the call backorder
    * */
    public setOrder(array:{taskName:string}[]){

        return this;
    }

    public async eachTask(cb: (task:ITask) => Promise<any>){

        if(!cb)return;

        if( this.tasks.length === 0 ) await this.loadTasks();

        const numOfTasks = this.tasks.length;
        for(let i = 0; i < numOfTasks; i++)
        await cb(this.tasks[i]);

    }
}