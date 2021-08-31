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
    repeatHors; // todo rename it correctly
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

        if(this.repeatDays.includes('STARTYEAR') &&
            new Date().getMonth() == 0 && (
                new Date().getDay() == 0 ||
                new Date().getDay() == 7 ||
                new Date().getDay() == 14 ||
                new Date().getDay() == 30
            )){
            return  true;
        }

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
            having (TIMESTAMPDIFF(HOUR, now(), lastRun) < -1 ) or !lastRun  `, //  order by companyId
            ).then(tasks => this.tasks = tasks.map(v => new Task(v)))
           .then(()=> this);
    }

    /*
    * Sets the callback order
    * */
    public setOrder(array:{taskName:string}[]){
        let names = array.map(obj => obj.taskName);
        this.tasks      .sort((a,b)=> names.indexOf(a.taskName) - names.indexOf(b.taskName))
        return this;
    }

    public async eachTask(cb: (task:ITask) => Promise<any>){

        if(!cb)return;

        if( this.tasks.length === 0 ) await this.loadTasks();

        const numOfTasks = this.tasks.length;
        for(let i = 0; i < numOfTasks; i++)
        await cb(this.tasks[i]);

        //console.log('Cron:done:eachTask',new Date());
    }

    public updateTaskTs(task:ITask){
       const  {taskName,companyId} = task;
       return this.db.update(`
       update COM_Tasks set lastRun = now() where  companyId = ? and taskName =  ?
       `,[companyId,taskName]);
    }
}