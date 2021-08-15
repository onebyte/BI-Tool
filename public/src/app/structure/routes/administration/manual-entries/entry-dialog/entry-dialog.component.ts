import {AfterViewInit, Component, EventEmitter, Input,  Output } from '@angular/core';

declare const bootstrap;



@Component({
  selector:    'dia-data-entry',
  templateUrl: './entry-dialog.component.html',
  styleUrls: [ './entry-dialog.component.scss'],
})
export class DataEntryDialogComponent implements AfterViewInit {

  id = 'entryModalCenter'

  @Input() entry:any;

  modal = {
    el: null,
    tab:''
  }

  @Output() onSave    = new EventEmitter();
  @Output() onDelete  = new EventEmitter();
  @Output() onClose   = new EventEmitter();

  /**
   * 'T' Technik
   * 'M' Marketing
   * 'K' Kreation
   * */
  salesTypes = [
    {
      name:'Technik',
      type:'T',
    },
    {
      name:'Marketing',
      type: 'M',
    },
    {
      name:'Kreation',
      type: 'C'
    }
  ];


  constructor() {}

  ngOnInit() {

  }

  ngAfterViewInit(){
    this.modal.el = new bootstrap.Modal('#'+this.id,{
      backdrop:false
    })
    this.modal.el.show()
  }


  closeModal(){
    this.modal.el.hide()
    this.onClose.emit()
  }

  save(){

    this.onSave.emit(this.entry);

    setTimeout((()=>this.onClose.emit()),1);
  }

  delete(){
    this.onDelete.emit(this.entry.entryId);
  }



}
