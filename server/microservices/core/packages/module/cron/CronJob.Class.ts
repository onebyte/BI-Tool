import {CronTaskHandler} from "./CronJob.Task.Class";

export namespace Cron {
    export class Job {

        protected tasks:CronTaskHandler

        public register(taskName: string, callback: (companyId) => Promise<boolean>){
            return this;
        }

        public do(timeStamp){

        }
    }
}

