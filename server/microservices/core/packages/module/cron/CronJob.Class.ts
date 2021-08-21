import {CronTaskHandler} from "./CronJob.Task.Class";

export namespace Cron {
    export class Job {

        protected tasks:CronTaskHandler

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
          if(taskReg && this.canCall(taskName,date)) taskReg.cb(params.companyId);
          else console.error('Task not found: ' + taskName);
        }

        /*
        * Verify if callback can be called
        * */
        private canCall(taskName:string,date:Date){
            return false;
        }

        public async do(executionDate:Date){
            return (await this.tasks.loadTasks())
                .setOrder(this.registrations)
                .eachTask(async (task) =>
                    this.call(task.taskName,task, executionDate))
        }
    }
}

