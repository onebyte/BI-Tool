/*
 * SW Integration
 * Author: Weslley
 * Onebyte@2021
 */
import { SwUpdate } from '@angular/service-worker';
import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import { interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import {isPlatformBrowser} from "@angular/common";

const checkInterval = 1000 * 60 * 10;

enum EMessageType {
    updateFailed = -1,
    canUpdate = 0,
    didUpdate = 1
}

@Injectable({providedIn: 'root'})
export class CheckForUpdateService {

    public a2hS = null;

    private dialogType = 'inline'

    private isBrowser;

    constructor(private updates: SwUpdate, @Inject(PLATFORM_ID) platformId: Object) {
      this.isBrowser =  isPlatformBrowser(platformId);
      if(this.isBrowser){
        const canActivate = () => (environment.pwa && ( 'serviceWorker' in window.navigator));
        if (canActivate()) {
          this.init();
          this.listen();
        }
        else {
          console.warn('Service Worker not enabled');
          this.clearServiceRegistrations()
        }
      }
     }

    private init() {
        if(!this.isBrowser)return;

        this.updates.checkForUpdate();

        /**Check if an update has been made*/
        if (sessionStorage.getItem('willUpdate')) {
            // clear state
            sessionStorage.removeItem('willUpdate');

            // Inform user
            setTimeout(() => this.showUpdateMessage(EMessageType.didUpdate), 2300);

            console.log('Update Successfull');
        }

        /**Add SW to global scope: for manual testing*/
        (<any>window).checkUpdate = () => {
            console.warn('Checking for Updates');
            this.updates.checkForUpdate();
            return this.updates;
        };

        /** A2HS */
        if(!self.matchMedia('(display-mode: standalone)').matches) self.addEventListener('beforeinstallprompt', (e:any) => this.a2hS = e);
    }

    /**
     * Initialises subscriptions
     * */
    private listen() {
        interval(checkInterval).subscribe(() => this.updates.checkForUpdate());

        /**
         * Observer on update state: available
         * */
        this.updates.available.subscribe(async event => {
            console.info('Current version is', event.current);
            console.info('Available version is', event.available);
            this.clearServiceRegistrations(event.available.hash);
            this.updates.activateUpdate().then(() => this.updateIsAvailable());
        });

        /**
         * Observer on update state: activated
         * Triggers after update
         * */
        this.updates.activated.subscribe(event => {
            console.log('old version was', event.previous);
            console.log('new version is',  event.current);
        });
    }

    /**
     * Callback on update state: Available
     * */
    private updateIsAvailable() {
        this.showUpdateMessage(EMessageType.canUpdate);
    }

    /**
     * Displays Message to current user
     * */
    private showUpdateMessage(type: EMessageType) {
        // Dialog is present in the DOM
        if (this.dialogType === 'inline') {
            const dialog = {
                container: <HTMLElement>document.querySelector('.update-container'),
                dialogBTN: <HTMLElement>document.querySelector('.update-container button')
            };
            switch (type) {
                case EMessageType.didUpdate: {

                    // hide
                    setTimeout(() => (dialog.container.style.display = 'none'), 2200);

                    dialog.container.innerHTML =` <a style="padding-right: 20px" class="text-dark"> Update erfolgreich </a>`

                    // show
                    dialog.container.style.display = '';

                    break;
                }

                case EMessageType.canUpdate: {
                    // show
                    dialog.container.style.display = '';

                    // hide
                    dialog.dialogBTN.onclick = ev => {
                        sessionStorage.setItem('willUpdate','1')
                        CheckForUpdateService.doUpdate();
                    };
                }
            }
        }
    }

    public clearServiceRegistrations(skip:string = null){
     try {
       (async ()=>{
         const keys = await window.caches.keys();
         keys.map(key => console.log( key.includes(skip),key,skip));
         await Promise.all(keys.map(key => key.includes(skip)  ? null :caches.delete(key)));
         if(environment.pwa)this.updates.checkForUpdate();
       })();
     }catch (e){}
    }

    /**
     * do reload and set update state
     * */
    static doUpdate() {
      sessionStorage.getItem('willUpdate');
      self.location.reload(true);
    }

     public promptUserToInstall(){
      if(this.a2hS){
        // Show the prompt
        this.a2hS.prompt();
        // Wait for the user to respond to the prompt
        this.a2hS.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
            this.a2hS = null
          } else {
            console.log('User dismissed the A2HS prompt');
          }
        });
      }
    }

}
