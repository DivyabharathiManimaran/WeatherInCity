import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { CityData, CityFromJson, DisplayWeather, WeatherResponse } from "./model/weather-response.model";
import { WeatherUtilityService } from "./service/weather-utility.service";
import { interval, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

const CITY = 'cityName';

@Component({
    selector:'weather-component',
    templateUrl:'./weather.component.html',
    styleUrls:['./weather.component.scss']
})
export class WeatherComponent implements OnInit, OnDestroy {

    cityControl = new FormControl('',Validators.pattern("[a-zA-Z][a-zA-Z -]*"));
    weatherDetails?:WeatherResponse;
    cityCtrlVal:string ='';
    lat?:number;
    long?: number;
    waitingLocPerm:boolean = false;
    accessDenied:boolean = false;
    currentLoc:boolean = false;
    cityName?:string;
    errorMsg?:string;
    displayWeather?:DisplayWeather;
    geoLocationWatch?: any;
    coordTimerSubs?: Subscription;
    cityTimerSubs?: Subscription;
    citySubs?: Subscription;
    weatherDetSubs?:Subscription;
    coordSubs?: Subscription;
    options: string[] = [];
    filteredOptions?: Observable<string[]>;

    constructor(
        @Inject(SESSION_STORAGE)public storage: StorageService,
        readonly weatherService: WeatherUtilityService) {
            this.getCitiesFromAPI();
        }

    ngOnInit() {
        /** Filtering cities based on input text */
        this.filteredOptions = this.cityControl.valueChanges.pipe(
            startWith(''),
            map(val => val.length >= 3 ? this.filter(val): [])        
        );
        /** Check conditions on refresh */
        if(this.storage.get(CITY)) {
            this.waitingLocPerm= false;
            this.search(this.storage.get(CITY));
        }
        else {
            this.getCurrentLocation();
        }
        /** Monitor state change */
        this.weatherDetSubs = this.weatherService.weatherDetail$.subscribe((resp:DisplayWeather) => {
            if(resp) {
                this.errorMsg = '';
                this.displayWeather = resp;
            }
        });
    }

    /**Get Cities from API */
    getCitiesFromAPI() {
        this.weatherService.getCities().subscribe( (resp: CityData) => {
            this.options=[];
            for(let item of resp.data) {
                this.options.push(...item.cities);
            }
            this.options.sort();
        }, () =>{
            this.getFromJson()
        });
    }       

    /**Get Cities from JSON */
    getFromJson() {
        this.weatherService.getCitiesFromJson().subscribe( (res:CityFromJson) => {
            this.options=[];
            this.options.push(...res.cities);
            this.options.sort();
        });
    }

    /** Filtering cities based on input text */
    filter(val:string):string[] {
        const filterVal = val.toLocaleLowerCase();
        return [...new Set(this.options.filter(option => option.toLocaleLowerCase().startsWith(filterVal)))];
    }

    /** Get Weather using current location info */
    getCurrentLocation() {
        this.waitingLocPerm=true;
        if("geolocation" in navigator) {
            this.geoLocationWatch = navigator.geolocation.watchPosition( resp => {
                this.waitingLocPerm= false;
                this.errorMsg='Loading...';
                this.currentLoc=true;
                this.setCoord(resp.coords.latitude, resp.coords.longitude);
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

    /** Get Weather using location coordinates */
    getUsingCoord(lat:number, long:number) {        
        this.weatherService.getWeatherByCoord(lat, long).subscribe((resp:WeatherResponse) => {
            this.weatherDetails = resp;
            this.errorMsg='';
            this.weatherService.setDetails(this.weatherDetails);
        }, error => {
            if(error.error.message) this.errorMsg = (error.error.message);
            else this.errorMsg = "Unable to fetch results!"
            
        });
    }

    searchClick(city:string) {
        if(this.cityCtrlVal && this.cityControl.valid && (this.cityName?.toLowerCase() !== city.toLowerCase())) {
            this.clearPrevSubs();
            this.search(city);
        }
    }

    /** Update weather every 10 seconds */
    search(city:string) {
        this.errorMsg='Loading...';
            this.fetchByCity(city);
            this.cityTimerSubs = interval(10000).subscribe((x =>{
                this.fetchByCity(city);
            }));
    }

    /** Get Weather using city name */
    fetchByCity(city:string) {
        this.citySubs = this.weatherService.getWeatherByCity(city).subscribe((resp:WeatherResponse) => {
            if(this.storage.get(CITY) !== city)this.storage.set(CITY, city);
            this.cityName = city;
            this.weatherDetails = resp;
            this.currentLoc=false;
            this.waitingLocPerm = false;
            this.accessDenied=false;
            this.errorMsg='';
            this.setCoord(resp.coord.lat,resp.coord.lon);
            this.weatherService.setDetails(this.weatherDetails);
        }, error => {
            this.clearPrevSubs();  
            if(error.statusText == "Not Found") {
                this.errorMsg = "City not found! Please verify the city name or search for another city.";
            } else if(error.error.message) this.errorMsg = (error.error.message);
            else this.errorMsg = "Unable to fetch results!"
            
        });
    }

    /** Get coordinates from map */
    setMapCoords(event: { coords: { lat: number; lng: number; }; }){           
        this.clearPrevSubs();   
        this.cityName = '';
        this.setCoord(event.coords.lat, event.coords.lng);
        if(this.lat && this.long)this.getUsingCoord(this.lat,this.long);
        else this.errorMsg = 'Unable to fetch the coordinates. Please try searching using city name!';
    }

    setCoord(lat:number,long:number) {
        this.lat = lat;
        this.long = long;
    }

    clearPrevSubs() {
        this.cityTimerSubs?.unsubscribe();
        if(this.geoLocationWatch)navigator.geolocation.clearWatch(this.geoLocationWatch); 
    }

    ngOnDestroy() {
        this.clearPrevSubs();
        this.citySubs?.unsubscribe();
        this.weatherDetSubs?.unsubscribe();
        this.coordSubs?.unsubscribe();
    }
}