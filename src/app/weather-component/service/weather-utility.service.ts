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
        return this.http.get<CityData>('https://countriesnow.space/api/v0.1/countries');
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

    // getWeatherByCity(city:string): WeatherResponse {
    //     let params = new HttpParams().set('q', city).set('units', 'metric').set('appid', this.apiKeyId);

    //     return JSON.parse('{"coord":{"lon":77.2167,"lat":28.6667},"weather":[{"id":701,"main":"Mist","description":"mist","icon":"50n"}],"base":"stations","main":{"temp":26.05,"feels_like":26.05,"temp_min":26.05,"temp_max":26.05,"pressure":1009,"humidity":83},"visibility":4000,"wind":{"speed":2.06,"deg":270},"clouds":{"all":20},"dt":1634655204,"sys":{"type":1,"id":9165,"country":"IN","sunrise":1634604850,"sunset":1634645865},"timezone":19800,"id":1273294,"name":"Delhi","cod":200}');
    // }
}