import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { CityData, CityFromJson, DisplayWeather, WeatherResponse } from "./model/weather-reesponse.model";
import { WeatherUtilityService } from "./service/weather-utility.service";
import { interval, Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as moment from "moment";

const CITY = 'cityName';

@Component({
    selector:'weather-component',
    templateUrl:'./weather-component.html',
    styleUrls:['./weather-component.scss']
})
export class WeatherComponent implements OnInit, OnDestroy {

    lat?:number;
    long?: number;
    weatherDetails?:WeatherResponse;
    cityNameVal:string ='';
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
    cityControl = new FormControl('',Validators.pattern("[a-zA-Z][a-zA-Z -]*"));
    filteredOptions?: Observable<string[]>;

    dispFunc(subj:any) {
        return subj ? subj.name : undefined;
    }

    constructor(
        @Inject(SESSION_STORAGE) private storage: StorageService,
        private readonly weatherService: WeatherUtilityService) {
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

    ngOnInit() {
        this.filteredOptions = this.cityControl.valueChanges.pipe(
            startWith(''),
            map(val => val.length >= 3 ? this.filter(val): [])        
        );
        if(this.storage.get(CITY)) {
            this.waitingLocPerm= false;
            this.search(this.storage.get(CITY));
        }
        else {
            this.getCurrentLocation();
        }
        this.weatherService.weatherDetail$.subscribe((resp:DisplayWeather) => {
            if(resp) {
                this.errorMsg = '';
                this.displayWeather = resp;
            }
        });
    }
    getFromJson() {
        this.weatherService.getCitiesFromJson().subscribe( (res:CityFromJson) => {
            this.options=[];
            this.options.push(...res.cities);
        })

    }

    filter(val:string):string[] {
        const filterVal = val.toLocaleLowerCase();
        return [...new Set(this.options.filter(option => option.toLocaleLowerCase().startsWith(filterVal)))];
    }

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
        if(this.cityName !== city) {
            this.clearPrevSubs();
            this.search(city);
        }
    }

    search(city:string) {
        this.errorMsg='Loading...';
            this.fetchByCity(city);
            this.cityTimerSubs = interval(10000).subscribe((x =>{
                this.fetchByCity(city);
            }));
    }

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

    getCoords(event: { coords: { lat: number; lng: number; }; }){           
        this.clearPrevSubs();   
        this.cityName = '';
        this.setCoord(event.coords.lat, event.coords.lng);
        if(this.lat && this.long)this.getUsingCoord(this.lat,this.long);
        else this.errorMsg = 'Unable to fetch the coordinates. Please try searching using city name!';
    }

    clearPrevSubs() {
        this.cityTimerSubs?.unsubscribe();
        if(this.geoLocationWatch)navigator.geolocation.clearWatch(this.geoLocationWatch); 
    }
    setCoord(lat:number,long:number) {
        this.lat = lat;
        this.long = long;
    }

    ngOnDestroy() {
        this.clearPrevSubs();
        this.citySubs?.unsubscribe();
        this.weatherDetSubs?.unsubscribe();
        this.coordSubs?.unsubscribe();
    }
}