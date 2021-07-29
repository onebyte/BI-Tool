import {Injectable} from "@angular/core";

class User{

  id:any

  email:string

  firstName:string

  lastName:string

  profileImage:string

  uuId:string;

  public initialise(data){
    Object.assign(this,data)
  }

  public export(){
    return this
  }
}

@Injectable({providedIn: 'root'})
export class StoreUser{

  readonly user = new User();

  constructor()  {}

  getUserId(){
    return this.user.id;
  }

  isValid(){
    return this.getUserId()>0 && this.user.email && ((cname)=>{
      var name = cname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    })('uuId')
  }

  initialise(data){
    this.user.initialise(data)
    return this;
  }

  export(){
    return this.user.export()
  }

  storeLocal(){
    localStorage.setItem('user',JSON.stringify(this.export()))
  }
}
