import {EventEmitter} from "@angular/core";

class IFieldOptions{
    tag?:string
    id?:string
    type:string
    name?:string
    value?:any
    className?:string
    containerClassName?:string
    required?:boolean
    regex?:any
    minLength?:number
    maxlength?:number
    section?:number // view /container ngif
    options?:{value:string,label:string}[]
    exportGroup?:string
    placeholder?:string
}


export class AuthFormBuilder {

    public          title    = '';
    public          subTitle = '';
    public          mainText = '';
    public          submitText = '';
    public          class    = '';

    public form     = [];

    readonly msg      = {
        error:''
    };

    readonly onSubmit = new EventEmitter();

    constructor() {}

    getFormForSection(id){
        return this.form.filter( a => a.section == id);
    }

    public getFormByLabel(label:string){
        return this.form.find( a => a.label == label);
    }

    public addFormGroup(label:string, options : IFieldOptions,cb?:any){
      if(!cb)cb=()=>null;
      options.tag                = options.tag || 'input'
      options.className          = 'form-control ' + (options.className||'');
      options.containerClassName = 'form-group '   + (options.containerClassName||'');
      this.form.push({label, ...options, cb});
    }

    private validatePhone(phone) {
        const re =  /^()^/
        return re.test(String(phone).toLowerCase());
    }

    private validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    private verifyField(a){
        a.isValid   = true;
        a.isMissing = false

        delete a.error;

        if(a.required && !a.value){
            a.isMissing = true;
            a.isValid = false;
        }

        if(a.type === 'email'){
            a.isValid  = this.validateEmail(a.value);
            if(! a.isValid ){
                a.isValid = false;
                a.error = 'emailinvalid'
                return  a
            }

        }

        if(a.minLength > ( a.value || '').length){
            a.isValid = false;
            a.error = 'lengthinvalid'
        }

        return  a;
    }

    private canSubmit(array){
        return array.filter(a => !a.isValid ).length === 0;
    }

    public submit(params:{section:number} = {section:null}){
        let fields = this.form.filter(a => a.required && (!params.section || a.section == params.section));
        fields.forEach(a => this.verifyField(a));

        if(this.canSubmit(fields)) this.onSubmit.emit({...params,fields});
    }

    public export(group = null){
        let obj = {}
        this.form.forEach(a =>{
            if(group){
                if(a.exportGroup == group) obj[a.name || a.id] = a.value
            }else {
                obj[a.name || a.id] = a.value
            }
        });
        return obj
    }

}
