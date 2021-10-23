import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import * as moment from "moment";
import { BehaviorSubject, Observable } from "rxjs";
import { CityData, CityFromJson, DisplayWeather, WeatherResponse } from "../model/weather-reesponse.model";

@Injectable({
    providedIn:"root"
})

export class WeatherUtilityService {
    baseUrl:string = 'https://api.openweathermap.org/data/2.5/weather';
    apiKeyId:string = '8f91e62c5a282e9848f51b6a78646f11';
    cityAPI='https://countriesnow.space/api/v0.1/countries';
    private readonly weatherDetails = new BehaviorSubject<DisplayWeather>({
        city:'',
        isDay: false,
        sunSetTime:'',
        currentTemp:0,
        minTemp:0,
        maxTemp:0,
        feelsLike:0,
        humidity:0
    });
    readonly weatherDetail$ = this.weatherDetails.asObservable();

    constructor(private readonly http: HttpClient) { }

    getCities(): Observable<CityData>{
        return this.http.get<CityData>(this.cityAPI);
    }

    getCitiesFromJson(): Observable<CityFromJson>{
        return this.http.get<CityFromJson>('assets/jsons/city-name-list.json');
    }

    getWeatherByCoord(lat:number, long:number): Observable<WeatherResponse> {
        let params = new HttpParams().set('lat', lat).set('lon', long).set('units', 'metric').set('appid', this.apiKeyId);

        return this.http.get<WeatherResponse>(this.baseUrl, {params});
    }

    getWeatherByCity(city:string): Observable<WeatherResponse> {
        let params = new HttpParams().set('q', city).set('units', 'metric').set('appid', this.apiKeyId);

        return this.http.get<WeatherResponse>(this.baseUrl, {params});
    }

    setDetails(details: WeatherResponse) {
        let dispWeather:DisplayWeather;
        let sunSetTime = moment(moment(details.sys.sunset *1000), 'hh:mma');
        let currentTime = moment(moment(),'hh:mma');
        dispWeather = {
            city : details.name,
            sunSetTime: sunSetTime.toLocaleString(),
            isDay : sunSetTime.isAfter(currentTime),
            currentTemp : details.main.temp,
            minTemp : details.main.temp_min,
            maxTemp : details.main.temp_max,
            feelsLike : details.main.feels_like,
            humidity :  details.main.humidity,
        }
        this.weatherDetails.next(dispWeather);
    }
}