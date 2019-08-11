import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BasicEventInfo } from '../model/basic-event-info';
import { Event } from '../model/event';
import { ItemsByCategory } from '../model/items-by-category';
import { WaitingListSubscriptionRequest } from '../model/waiting-list-subscription-request';
import { ValidatedResponse } from '../model/validated-response';
import { map, shareReplay } from 'rxjs/operators';
import { EventCode } from '../model/event-code';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private eventCache: {[key: string]: Observable<Event>} = {};

  constructor(private http: HttpClient) { }

  getEvents(): Observable<BasicEventInfo[]> {
    return this.http.get<BasicEventInfo[]>('/api/v2/public/events');
  }

  getEvent(eventShortName: string): Observable<Event> {
    // caching as explained with https://blog.angularindepth.com/fastest-way-to-cache-for-lazy-developers-angular-with-rxjs-444a198ed6a6
    if (!this.eventCache[eventShortName]) {
      this.eventCache[eventShortName] = this.http.get<Event>(`/api/v2/public/event/${eventShortName}`).pipe(shareReplay(1));
      setTimeout(() => {
        delete this.eventCache[eventShortName];
      }, 60000 * 20); // clean up cache after 20 minutes
    }

    return this.eventCache[eventShortName];
  }

  getEventTicketsInfo(eventShortName: string, code?: string): Observable<ItemsByCategory> {
    const params = code ? {params: {code: code}} : {};
    return this.http.get<ItemsByCategory>(`/api/v2/public/event/${eventShortName}/ticket-categories`, params);
  }

  getAvailableLanguageForEvent(eventShortName: string): Observable<string[]> {
    return this.getEvent(eventShortName).pipe(map(event => event.contentLanguages.map(v => v.locale)));
  }

  submitWaitingListSubscriptionRequest(eventShortName: string, waitingListSubscriptionRequest: WaitingListSubscriptionRequest): Observable<ValidatedResponse<boolean>> {
    return this.http.post<ValidatedResponse<boolean>>(`/api/v2/public/event/${eventShortName}/waiting-list/subscribe`, waitingListSubscriptionRequest);
  }

  validateCode(eventShortName: string, code: string): Observable<ValidatedResponse<EventCode>> {
    return this.http.get<ValidatedResponse<EventCode>>(`/api/v2/public/event/${eventShortName}/validate-code`, {params: {code: code}});
  }
}
