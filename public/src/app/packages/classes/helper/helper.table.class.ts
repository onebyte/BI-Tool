export namespace Helper{

export class Table<ListType>{

  public values:ListType[] = [];

  readonly filterParams = {
    total:'500',
    page:0,
    searchValue:'',
    role:''
  }

  readonly pagination   = {
    enabled:false,
    current:0,
    next:true,
    prev:false,
    total:0,
    onNext:()=>null,
    onPrev:()=>null,
    getPagesNum:()=>{
      let totalPerPage = +this.filterParams.total;
      let totalEntries = +this.pagination.total;
      // totaleWerte / angezeigte pro seite | zb: 100 / 50 = 2
      return Array.from(Array(Math.ceil(totalEntries / totalPerPage)).keys())
    },
    setPage:(x)=>{
      this.filterParams.page = x;
      this.on.getData()
    }
  }

  constructor(public keys,options = null) {
    if(options)this.initialiseOptions(options)
  }

  initialiseOptions(options){
    options.cb = options.cb || {};
    if(options.cb.getData) this.on.getData = x => options.cb.getData(x)
  }

  setValues(arry:any){
    if(arry.data){
      this.pagination.enabled = arry.per_page < arry.total
      this.values             = arry.data;
      this.pagination.total   = arry.total;
      this.pagination.current = arry.current_page;
    }else {
      this.pagination.enabled = false
      this.values = arry
    }
  }

  addValue(data:ListType){
    this.values.push(data)
  }

  public readonly on = {
    getData:(p = this.filterParams)=>null
  }
}

}
