import {AfterViewInit, Component, EventEmitter, Input,  Output } from '@angular/core';

declare const bootstrap;

@Component({
  selector:    'dialog-role',
  templateUrl: './role-dialog.component.html',
  styleUrls: [ './role-dialog.component.scss'],
})
export class RoleDialogComponent implements AfterViewInit {

  @Input() role;

  @Input() apps  = [];
  @Input() users = [];

  modal = {
    el: null,
    tab:''
  }

  @Output() onSave   = new EventEmitter();
  @Output() onClose  = new EventEmitter();
  @Output() onDelete = new EventEmitter();

  selectedApps  = {}
  selectedUsers = {}

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit(){
    this.role.apps.forEach(app=>{
      this.selectedApps[app.appId] = app.access
    })
    this.apps.forEach(app=>{
      this.selectedApps[app.appId] =this.selectedApps[app.appId] || ''
    })

    this.role.users.forEach(userId=>{
      this.selectedUsers[userId] = true
    })

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
    let apps = [];
    for(let key in this.selectedApps){
      if(this.selectedApps[key])
      apps.push(
        {
          appId:key,
          access:this.selectedApps[key]
        }
      )
    }

    let users = [];
    for(let key in this.selectedUsers){
      if(this.selectedUsers[key]){
        users.push(key)
      }
    }

    this.onSave.emit({
      roleId:this.role.id || this.role.roleId,
      name:this.role.name,
      apps,
      users,
      enabled:this.role.enabled
    });
    setTimeout((()=>this.onClose.emit()),1)
  }

  delete(){
    this.onDelete.emit(this.role.id || this.role.roleId)
  }

  toggleUserState = false
  toggleAllUsers(){
    this.toggleUserState = !this.toggleUserState
    this.users.forEach(user => {
      this.selectedUsers[user.userId] =this.toggleUserState
    })
  }
}
