import { Component, Inject, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { WeatherResponse } from "./model/weather-reesponse.model";
import { WeatherUtilityService } from "./service/weather-utility.service";

const CITY = 'cityName';

@Component({
    selector:'weather-component',
    templateUrl:'./weather-component.html',
    styleUrls:['./weather-component.scss']
})
export class WeatherComponent implements OnInit {
    citySearchForm !: FormGroup;
    lat?:number;
    long?: number;
    weatherDetails?:WeatherResponse;
    cityNameVal:string ='';

    constructor(
        @Inject(SESSION_STORAGE) private storage: StorageService,
        private readonly weatherService: WeatherUtilityService,
        private readonly fb: FormBuilder) {}

    ngOnInit() {
        this.citySearchForm = this.fb.group({
            cityName: new FormControl('',Validators.pattern("[a-zA-Z]*")),
        });
        if(this.storage.get(CITY)) this.search(this.storage.get(CITY));
        else this.getCurrentLocation();
    }
    get getForm(){
        return this.citySearchForm.controls;
    }

    search(city:string) {
        this.weatherService.getWeatherByCity(city).subscribe((resp:WeatherResponse) => {
            this.storage.set(CITY, city);
            this.weatherDetails = resp;
            console.log(this.weatherDetails);
        });
    }
    getCurrentLocation() {
        if("geolocation" in navigator) {
            navigator.geolocation.watchPosition( resp => {
                this.lat = resp.coords.latitude;
                this.long = resp.coords.longitude;
                this.getUsingCoord();
            })
        }

    }

    getUsingCoord() {
        if(this.lat && this.long) {
            this.weatherService.getWeatherByCoord(this.lat,this.long).subscribe((resp:WeatherResponse) => {
                this.weatherDetails = resp;
                console.log(this.weatherDetails);
            });
        }
    }
}