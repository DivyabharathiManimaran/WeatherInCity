import { Component, Inject, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { DisplayWeather, WeatherResponse } from "./model/weather-reesponse.model";
import { WeatherUtilityService } from "./service/weather-utility.service";
import * as moment from "moment";

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
    sunSetTime?:string;
    displayWeather:DisplayWeather = {
        city:'',
        isDay: false,
        sunSetTime:'',
        currentTemp:0,
        minTemp:0,
        maxTemp:0,
        feelsLike:0,
        humidity:0
    };

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
                this.setDetails();
            }, error => {
                if(error.statusText == "Not Found") {
                   this.errorMsg = "City not found! Please verify the city name.";
                } else if(error.error.message) this.errorMsg = (error.error.message);
                else this.errorMsg = "Unable to fetch results!"
                
            });
        }

        // this.weatherDetails = this.weatherService.getWeatherByCity(city);
        // console.log(this.weatherDetails);
        // this.setDetails();
    }
    setDetails() {
        if(this.weatherDetails) {
            this.displayWeather.city = this.weatherDetails.name;
            let sunSetTime = moment(moment(this.weatherDetails.sys.sunset *1000), 'hh:mma');
            this.displayWeather.sunSetTime= sunSetTime.toLocaleString();
            let currentTime = moment(moment(),'hh:mma');
            this.displayWeather.isDay = sunSetTime.isAfter(currentTime);
            this.displayWeather.currentTemp = this.weatherDetails.main.temp;
            this.displayWeather.minTemp = this.weatherDetails.main.temp_min;
            this.displayWeather.maxTemp = this.weatherDetails.main.temp_max;
            this.displayWeather.feelsLike = this.weatherDetails.main.feels_like;
            this.displayWeather.humidity =  this.weatherDetails.main.humidity;
            this.lat=this.weatherDetails.coord.lat;
            this.long=this.weatherDetails.coord.lon;
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
                }else if(error.message) this.errorMsg = error.message;
                else this.errorMsg = "Unable to fetch results!"
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
                    this.setDetails();
                }, error => {
                    if(error.error.message) this.errorMsg = (error.error.message);
                    else this.errorMsg = "Unable to fetch results!"
                    
                });
            }
    }
    getCoords(event: { coords: { lat: number; lng: number; }; }){
        let lat = event.coords.lat;
        let long = event.coords.lng;
        if(lat && long) this.getUsingCoord(lat,long);


    }
}