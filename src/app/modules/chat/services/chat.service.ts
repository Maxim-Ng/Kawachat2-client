import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {environment} from '../../../../environments/environment';
import {Observable} from 'rxjs/Observable';
import {Chat} from '../models/chat';
import { UUID } from 'angular2-uuid';
import {CommonService} from "../../../services/common.service";

@Injectable()
export class ChatService {


  socket: any;

  socketConnected$ = new BehaviorSubject<boolean>(false);
  activeChats = [];
  featuredChats = [];

  constructor(private commonService: CommonService) {
    this.socket = io(environment.socket.base_url, environment.socket.opts);
    this.socket.on('connect', () => this.socketConnected$.next(true));
    this.socket.on('disconnect', () => this.socketConnected$.next(false));
    [
      'programming',
      'graphic_design',
      'gaming',
      'random'
    ].map (frq => this.featuredChats.push(new Chat(frq, this.listen('chat', frq))));
  }

  join(frq: string) {

    if(!this.commonService.username){
      this.commonService.username = UUID.UUID();
    }


    this.socket.emit('join', { frq, username: this.commonService.username });
    let chat = this.getChat(frq)
    if (!chat) {
      chat = new Chat(frq, this.listen('chat', frq));
      this.activeChats.push(chat);
    }
  }

  getChat(frq){
    return this.activeChats.filter(c => c.frq === frq)[0];
  }

  leave(frq: string) {
    this.socket.emit('leave', {frq});
    this.activeChats.filter( c => c.frq !== frq);
  }

  listen(event: string, frq: string): Observable<any> {

    return new Observable(observer => {

      this.socket.on(event, data => {
        if (data.frq === frq) {
          observer.next(data);
        }
      });

      // observable is disposed
      return () => {
        this.socket.off(event);
      }

    });

  }

}
