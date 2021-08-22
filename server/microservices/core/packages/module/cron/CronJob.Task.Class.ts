import Database from "../../database/Connection";

interface ITask {
    // ref to Company
    companyId:number;

    // unique (companyId,taskName)
    taskName:string;

    repeatDays;

    repeatHors;

    lastRun;

    enabled:boolean;
}

class Task implements ITask{

    companyId: number;
    enabled: boolean;
    lastRun;
    repeatDays:any[];
    repeatHors;
    taskName: string;


    constructor(params) {
        Object.assign(this,params)
    }

    public canRun(dayNum:number,hour:number,date = null){
        if(date){
            /*verify date between*/
        }
        return this.canRunOnDay(dayNum) && this.canRunOnHour(hour);
    }

    private canRunOnDay(dayNum){
        return this.repeatDays.includes(dayNum)
    }
    private canRunOnHour(hour){
        return this.repeatHors.includes(hour)
    }




}


export class CronTaskHandler {

    protected db:Database = new Database();

    protected _tableName:string = 'COM_Tasks';

    private tasks:ITask[];

    /*
     * Get all jobs/tasks from Database
     * */
    public async loadTasks():Promise<this>{
       return this.db.getRows(`
            select distinct * from ${this._tableName} where enabled
            having TIMESTAMPDIFF(HOUR, now(), lastRun) < -1 `, //  order by companyId
            ).then(tasks => this.tasks = tasks.map(v => new Task(v)))
           .then(()=> this);
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

    public updateTaskTs(task:ITask){
       const  {taskName,companyId} = task;
       return this.db.updateTable(this._tableName)
           .set('lastRun','now()')
            .where(null,[companyId,taskName],'companyId = ? and taskName = ?')
    }
}