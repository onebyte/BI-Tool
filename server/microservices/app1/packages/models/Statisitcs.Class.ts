import Database from "../../../core/packages/database/Connection";

export namespace Statistics{

    class Statisitcs {
     protected db:Database = new Database();

     static getSumOnly(query){
         return query.split(' as ')[0]
     }
    }

    export class Productivity extends Statisitcs{

        static sqlTotal   = `sum(if( concat(S.companyId,'-',activityId)  in (
                   select
                       concat(S.companyId,'-',activityId)
                   from COM_Activities where companyId = ? and (
                     prodLevel = 1 or prodLevel = 0
                   )
               ), S.total,0) ) as total`;

        static sqlProd    = `sum(if( concat(S.companyId,'-',activityId)  in (
                   select
                       concat(S.companyId,'-',activityId)
                   from COM_Activities where companyId = ? and prodLevel = 1
               ), S.total,0)) as totalProd`;

        static sqlNonProd = `sum(if( concat(S.companyId,'-',activityId)  in (
                   select
                       concat(S.companyId,'-',activityId)
                   from COM_Activities where companyId = ? and prodLevel = 0
               ), S.total,0) ) as totalNonProd`;

        static sqlIntern  = `sum(if(concat(companyId,'-',activityId) in (
                                   select
                                       concat(companyId,'-',activityId)
                                   from COM_Activities where companyId = ? and
                                       code = 000 and title like '%intern%' 
                                       ), S.total,0) ) as totalIntern`;

        static sqlAbsence = `sum(if(concat(companyId,'-',activityId) in (
                                   select
                                       concat(companyId,'-',activityId)
                                   from COM_Activities where companyId = ? and prodLevel < 0
                                   ), S.total,0) ) as totalAbsence`;

        static sqlBase    = `select year,month from TIME_SUM_Users S
                                 left join Auth_User AU on (  S.userId = AU.userId )
                             where S.companyId = ?`;

        constructor(protected companyId:number) {
            super()
        }

        getProductivityInternByType(type:string,year:number){
            let companyId = this.companyId
            return this.db.getRows(`select year,month,
                                 ROUND(sum(if(concat(companyId,'-',activityId) in (
                                            select
                                                concat(companyId,'-',activityId)
                                            from COM_Activities where companyId = ? and
                                                code = 000 and title like ?
                                        ), total,0))) as total
                                 from TIME_SUM_Users T where companyId = ? and year = ?
                                 group by year,month;`,[
                companyId,type,companyId,year
            ])
        }

        getProductivityByUsers( from, till){
            let companyId = this.companyId;

            return this.db.getRows(`
            select year,month,
                   ${Productivity.sqlTotal},
                   ${Productivity.sqlIntern},
                   ${Productivity.sqlAbsence},
                   ${Productivity.sqlProd},
                   round(100 / ( ${Statisitcs.getSumOnly(Productivity.sqlTotal)} / ${Statisitcs.getSumOnly(Productivity.sqlProd)})) as perc,
                   S.userId, AU.firstName, AU.lastName, AU.profileImage
                   from TIME_SUM_Users S
                                 left join Auth_User AU on (  S.userId = AU.userId )
                        where S.companyId = ? and 
                           (S.year >= YEAR(?) and month >= Month(?)) and
                            (S.year <= YEAR(?) and month <= Month(?))
                        group by  S.userId order by perc`,
                [
                companyId,
                companyId,
                companyId,
                companyId,
                companyId,
                companyId,
                companyId,
                from,from,
                till,till,
            ])
        }

        getProductivitySumByMonth(year:number){
         let companyId = this.companyId;
         return this.db.getRows(`
             select S.year, 
                    S.month, 
                    sum(S.total) as allHours,
                    round(100 / (${Statisitcs.getSumOnly(Productivity.sqlTotal)}/${Statisitcs.getSumOnly(Productivity.sqlProd)})) as perc
                     from TIME_SUM_Users S
                     where S.companyId = ? and S.year =  ?
                     group by S.year,S.month
            `,[companyId,companyId,companyId,year])
        }

        // onebyte startet statisitc at 2020.11
        getProductivitySumByMonthAll(){
            let companyId = this.companyId;
            return this.db.getRows(`
             select S.year, 
                    S.month, 
                    sum(total) as allHours,
                    round(100 / (${Statisitcs.getSumOnly(Productivity.sqlTotal)}/${Statisitcs.getSumOnly(Productivity.sqlProd)})) as perc
                     from TIME_SUM_Users S
                     where S.companyId = ? and (S.year > 2020 or (S.year = 2020 and S.month >= 11))
                     group by S.year,S.month
            `,[companyId,companyId,companyId])
        }

        getProductivitySumByYear(){
            let companyId = this.companyId
            return this.db.getRows(  `
                                   select year,
                                        (
                                            select total from FIN_LIST_ManualEntries M
                                            where E.companyId = M.companyId and
                                                M.entrySource = 'productivity' and
                                                S.year = year(M.date) order by M.date desc
                                            limit 1
                                        ) as target,
                                    round(100 / ( ${Statisitcs.getSumOnly(Productivity.sqlTotal)} / ${Statisitcs.getSumOnly(Productivity.sqlProd)})) as perc
                                 from TIME_SUM_Users S
                                          left join FIN_LIST_ManualEntries E on (
                                         E.companyId = S.companyId and
                                         E.entrySource = 'productivity' and
                                         S.year = year(E.date)
                                     )
                                 where S.companyId = ? and S.year > 2020
                                 group by S.year limit 5;`,
                [companyId,companyId,companyId])
        }

        getProductivityYearAVG(){
            let companyId = this.companyId;
            this.db.getRows(``)
        }
    }

}