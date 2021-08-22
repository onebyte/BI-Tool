import {CronTaskHandler} from "./CronJob.Task.Class";

export namespace Cron {
    export class Job {

        protected tasks:CronTaskHandler = new CronTaskHandler()

        protected registrations = [];

        /**
         * registers callback Functions to an array
         * */
        public register(taskName: string, callback: (companyId) => Promise<boolean>){
            this.registrations.push({taskName, cb:callback});
            return this;
        }

        /*
        * Invoke registered Task
        * */
        private async call(taskName:string,params:any,date:Date){
          let taskReg = this.registrations.find(reg => reg.taskName == taskName);
          if(taskReg && this.canCall(taskName,params,date)){
              await taskReg.cb(params.companyId)
              return true;
          };
        }

        /*
        * Verify if callback can be called
        * */
        private canCall(taskName:string,task,date:Date){
            return task.canRun(date.getDay(),date.getHours());
        }

        public async do(executionDate:Date){
            return (await this.tasks.loadTasks())
                .setOrder(this.registrations)
                 .eachTask(async (task) =>
                    this.call(task.taskName,task, executionDate))
        }
    }
}

