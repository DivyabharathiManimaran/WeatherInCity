import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { WeatherResponse } from "../model/weather-reesponse.model";

@Injectable({
    providedIn:"root"
})

export class WeatherUtilityService {
    baseUrl:string = 'https://api.openweathermap.org/data/2.5/weather';
    apiKeyId:string = '8f91e62c5a282e9848f51b6a78646f11';

    constructor(private readonly http: HttpClient) { }

    getWeatherByCoord(lat:number, long:number): Observable<WeatherResponse> {
        let params = new HttpParams().set('lat', lat).set('lon', long).set('units', 'metric').set('appid', this.apiKeyId);

        return this.http.get<WeatherResponse>(this.baseUrl, {params});
    }

    getWeatherByCity(city:string): Observable<WeatherResponse> {
        let params = new HttpParams().set('q', city).set('units', 'metric').set('appid', this.apiKeyId);

        return this.http.get<WeatherResponse>(this.baseUrl, {params});
    }
}