import {AfterViewInit, Component, EventEmitter, Input,  Output } from '@angular/core';

declare const bootstrap;



@Component({
  selector:    'dia-group',
  templateUrl: './group-dialog.component.html',
  styleUrls: [ './group-dialog.component.scss'],
})
export class GroupDialogComponent implements AfterViewInit {

  @Input() group;

  @Input() users = [];

  @Input() activities = [];

  modal = {
    el: null,
    tab:''
  }

  @Output() onSave    = new EventEmitter();
  @Output() onDelete  = new EventEmitter();
  @Output() onClose   = new EventEmitter();


  selectedUsers     = {}
  selectedLeadUsers = {}
  selectedActivity  = {}

  constructor() {}

  ngOnInit() {
    this.group.users.forEach(userId=>{
      this.selectedUsers[userId] = true;
    })
    this.group.usersLead.forEach(userId=>{
      this.selectedLeadUsers[userId] = true;
    })
    this.group.activities.forEach(id=>{
      this.selectedActivity[id] = true;
    })
  }

  ngAfterViewInit(){
    this.modal.el = new bootstrap.Modal('.modal',{
      backdrop:false
    })
    this.modal.el.show()
  }


  closeModal(){
    this.modal.el.hide()
    this.onClose.emit()
  }

  save(){

    let users = [];
    for(let key in this.selectedUsers){
      if(this.selectedUsers[key]){
        users.push(key)
      }
    }
    let usersLead = [];
    for(let key in this.selectedLeadUsers){
      if(this.selectedLeadUsers[key]){
        usersLead.push(key)
      }
    }
    let activities = [];
    for(let key in this.selectedActivity){
      if(this.selectedActivity[key]){
        activities.push(key)
      }
    }

    this.onSave.emit({
      labelId:this.group.labelId,
      title:  this.group.title,
      usersLead,
      users,
      activities,
      color:this.group.color
    });


    setTimeout((()=>this.onClose.emit()),1)
  }

  delete(){
    this.onDelete.emit(this.group.labelId)
  }

  toggleUserState = false
  toggleAllUsers(){
    this.toggleUserState = !this.toggleUserState
    this.users.forEach(user => {
      this.selectedUsers[user.userId] =this.toggleUserState
    })
  }

}
