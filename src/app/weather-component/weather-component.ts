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
    waitingLocPerm:boolean = false;
    accessDenied:boolean = false;
    currentLoc:boolean = false;
    cityName?:string;
    errorMsg?:string;

    constructor(
        @Inject(SESSION_STORAGE) private storage: StorageService,
        private readonly weatherService: WeatherUtilityService,
        private readonly fb: FormBuilder) {}

    ngOnInit() {
        this.citySearchForm = this.fb.group({
            cityName: new FormControl('',Validators.pattern("[a-zA-Z][a-zA-Z -]*")),
        });
        if(this.storage.get(CITY)) {
            this.search(this.storage.get(CITY));
            this.waitingLocPerm= false;
        }
        else this.getCurrentLocation();
    }
    get getForm(){
        return this.citySearchForm.controls;
    }

    search(city:string) {
        if(city!=this.cityName) {
            this.cityName = city;
            this.weatherService.getWeatherByCity(city).subscribe((resp:WeatherResponse) => {
                if(this.storage.get(CITY) !== city)this.storage.set(CITY, city);
                this.weatherDetails = resp;
                this.currentLoc=false;
                this.waitingLocPerm = false;
                this.accessDenied=false;
                this.errorMsg='';
            }, error => {
                if(error.statusText == "Not Found") {
                   this.errorMsg = "City not found! Please verify the city name.";
                } else this.errorMsg = (error.error.message);
                
            });
        }
    }
    getCurrentLocation() {
        this.waitingLocPerm=true;
        if("geolocation" in navigator) {
            navigator.geolocation.watchPosition( resp => {
                this.waitingLocPerm= false;
                this.currentLoc=true;
                this.errorMsg='';
                this.getUsingCoord(resp.coords.latitude,resp.coords.latitude);
            }, error => {
                if(error.code == error.PERMISSION_DENIED) {
                    this.waitingLocPerm = false;
                    this.accessDenied=true;
                }else this.errorMsg = error.message;
            })
        }

    }

    getUsingCoord(latitude:number, longitude:number) {
            if(latitude!== this.lat || longitude !== this.long) {
                this.weatherService.getWeatherByCoord(latitude, longitude).subscribe((resp:WeatherResponse) => {
                    this.weatherDetails = resp;
                    let city = resp.name;
                    if(this.storage.get(CITY) !== city)this.storage.set(CITY, city);
                    this.lat = latitude;
                    this.long = longitude;
                    this.errorMsg='';
                }, error => {
                    this.errorMsg = error.error.message;
                    
                });
            }
    }
}