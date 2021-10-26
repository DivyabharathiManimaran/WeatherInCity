import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, Directive, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { SESSION_STORAGE } from 'ngx-webstorage-service';
import { WeatherComponent } from './weather.component';
import { WeatherUtilityService } from './service/weather-utility.service';
import { CityData, CityFromJson, WeatherResponse } from './model/weather-response.model';
 
@Directive({ selector: '[oneviewPermitted]' })
class OneviewPermittedDirective {
  @Input() oneviewPermitted: any;
}

@Pipe({name: 'translate'})
class TranslatePipe implements PipeTransform {
  transform(value: any) { return value; }
}

@Pipe({name: 'phoneNumber'})
class PhoneNumberPipe implements PipeTransform {
  transform(value: any) { return value; }
}

@Pipe({name: 'safeHtml'})
class SafeHtmlPipe implements PipeTransform {
  transform(value: any) { return value; }
}

let weatherDetails = new BehaviorSubject<any>({
  city:'Berlin',
  isDay: false,
  sunSetTime:'',
  currentTemp:24,
  minTemp:24,
  maxTemp:24,
  feelsLike:23,
  humidity:60
});

const weathersServiceStub = {  
  getCities(): Observable<CityData>{
      return of({data:[{
        country: 'Germany',
        cities: ['Berlin', 'Munich']
      }]});
  },
  getWeatherByCity(): Observable<any> {
    return of({coord:{
      lat:10,
      lon:20
    }});
  },
  getWeatherByCoord(): Observable<any> {
    return of({coord:{
      lat:10,
      lon:20
    }});
  },
  weatherDetail$: weatherDetails.asObservable(),
  setDetails(param:any){
    weatherDetails.next(weatherDetails);
  }
};

const locationStub = {
  watchPosition(): Observable<any> {
    return of({coords:{
      latitude:10,
      longitude:20
    }});
  },
  clearWatch() {
    return {};
  }
}

/** Test cases for WeatherComponent */
describe('WeatherComponent', () => {
  let fixture:ComponentFixture<WeatherComponent>;
  let component:WeatherComponent;
  let latitude:number = 10;
  let longitude:number  = 20;
  let city:string = 'Berlin';

  beforeEach(()=> {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ReactiveFormsModule, MatAutocompleteModule ],
      declarations:[WeatherComponent],
      providers: [
        { provide: 'SESSION_STORAGE', useValue: SESSION_STORAGE },
        { provide: WeatherUtilityService, useValue: weathersServiceStub },
        { provide: navigator.geolocation, useValue: locationStub }
      ]
    }).compileComponents();
    spyOn(weathersServiceStub, "getCities").and.callThrough();
    fixture = TestBed.createComponent(WeatherComponent);
    component = fixture.debugElement.componentInstance;
  })

  it('should run constructor()', async () => {
    expect(component).toBeTruthy();
    expect(component.waitingLocPerm).toBeFalse;
    expect(component.accessDenied).toBeFalse;
    expect(component.currentLoc).toBeFalse;
    expect(component.cityCtrlVal).toEqual('');
    expect(component.options.length).toBeGreaterThanOrEqual(0);
    expect(component.getCitiesFromAPI).toBeDefined();
    expect(weathersServiceStub.getCities).toHaveBeenCalled();
  });

  describe("ngOnInit with city in storage", () => {
    it('should run ngOnInit()', async () => {
      component.storage.set('cityName', city);
      spyOn(weathersServiceStub, "getWeatherByCity").and.callThrough();
      spyOn(weathersServiceStub, "setDetails").and.callThrough();
      component.ngOnInit();
      expect(component.filter).toBeDefined();
      expect(component.filteredOptions).toBeDefined();  
      expect(weathersServiceStub.getWeatherByCity).toHaveBeenCalled();
      expect(component.cityName).toEqual(city);
      expect(component.weatherDetails).toBeDefined();
      expect(component.currentLoc).toBeFalse();
      expect(component.waitingLocPerm).toBeFalse();
      expect(component.accessDenied).toBeFalse();
      expect(component.errorMsg).toEqual('');
      expect(component.lat).toEqual(10);
      expect(component.long).toEqual(20);
      expect(weathersServiceStub.setDetails).toHaveBeenCalled();
      expect(component.displayWeather).toBeDefined();
    });
  });

  describe("ngOnInit on initial application load", () => {
    it('should run ngOnInit()', async () => {
      component.storage.clear();
      spyOn(weathersServiceStub, "getWeatherByCoord").and.callThrough();
      spyOn(weathersServiceStub, "setDetails").and.callThrough();
      component.ngOnInit();
      expect(component.displayWeather).toBeDefined();
    });
  });

  

  describe("Fetch Cities List", () => {
    it('should run getCitiesFromAPI()', async () => {
      component.getCitiesFromAPI();
      expect(weathersServiceStub.getCities).toHaveBeenCalled();
      expect(weathersServiceStub.getCities).toBeTruthy();        
    });
  });

  it('should run searchClick()', async () => {
    component.cityName = 'delhi';
    component.cityCtrlVal = city;
    spyOn(weathersServiceStub, "getWeatherByCity").and.callThrough();
    spyOn(weathersServiceStub, "setDetails").and.callThrough();
    component.setCoord(latitude,longitude);
    component.searchClick(city);
    expect(weathersServiceStub.getWeatherByCity).toHaveBeenCalled();
    expect(component.cityName).toEqual(city);
    expect(component.weatherDetails).toBeDefined();
    expect(component.currentLoc).toBeFalse();
    expect(component.waitingLocPerm).toBeFalse();
    expect(component.accessDenied).toBeFalse();
    expect(component.errorMsg).toEqual('');
    expect(component.lat).toEqual(10);
    expect(component.long).toEqual(20);
    expect(weathersServiceStub.setDetails).toHaveBeenCalled();
  });

  it('should run setMapCoords()', async () => {
    spyOn(weathersServiceStub, "getWeatherByCoord").and.callThrough();
    spyOn(weathersServiceStub, "setDetails").and.callThrough();
    component.setMapCoords({ coords: {lat : latitude, lng : longitude }});
    expect(component.cityTimerSubs).toBeUndefined();
    expect(component.cityName).toEqual('');
    expect(component.lat).toEqual(10);
    expect(component.long).toEqual(20);
    expect(weathersServiceStub.getWeatherByCoord).toHaveBeenCalled();        
    expect(component.weatherDetails).toBeDefined();
    expect(component.errorMsg).toEqual('');
    expect(weathersServiceStub.setDetails).toHaveBeenCalled();
  });

  it('should run #ngOnDestroy()', async () => {
    component.ngOnDestroy();
    expect(component.cityTimerSubs).toBeUndefined();
    expect(component.citySubs).toBeUndefined();
    expect(component.weatherDetSubs).toBeUndefined();;
    expect(component.coordSubs).toBeUndefined();;
  });
});

/** Test cases for WeatherUtiityService */
describe('WeatherUtiityService', () => {
  let httpClientSpy: { get: jasmine.Spy };
  let weatherService: WeatherUtilityService;
  const expectedWeatherResp : WeatherResponse = {
    coord: { lon: 80.1578, lat: 13.0741 },
    weather: [{ id: 701,main: "Mist",description: "mist",icon: "50n"}],
    base: "stations",
    main: { temp: 27.98, feels_like: 32.52, temp_min: 27.98, 
      temp_max: 27.98,  pressure: 1011, humidity: 83 },
    visibility: 3500,
    wind: { speed: 1.03,deg: 0 },
    clouds: { all: 40 },
    dt: 1635269601,
    sys: { type: 1, id: 9218, country: "IN", sunrise: 1635208288, sunset: 1635250499 },
    timezone: 19800,
    id: 1278840,
    name: "Ambattur",
    cod: 200
};
  
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    weatherService = new WeatherUtilityService(httpClientSpy as any);
  });
  
  it('should return expected Cities (HttpClient called once)', (done: DoneFn) => {
    const expectedCitiesResp: CityData = { 
      data: [{ country: "Germany", 
      cities: ["Berkheim","Berlin","Berlingerode","Bermatingen"]}]
    };  
    httpClientSpy.get.and.returnValue(of(expectedCitiesResp));  
    weatherService.getCities().subscribe(
      resp => {
        expect(resp).toEqual(expectedCitiesResp, 'expected cities');
        done();
      },
      done.fail
    );
    expect(httpClientSpy.get.calls.count()).toBe(1, 'one call');
  });

  it('should return expected Cities from Json (HttpClient called once)', (done: DoneFn) => {
    const expectedJsonCityResp: CityFromJson = {"cities": ["Berkheim","Berlin"]};  
    httpClientSpy.get.and.returnValue(of(expectedJsonCityResp));  
    weatherService.getCitiesFromJson().subscribe(
      resp => {
        expect(resp).toEqual(expectedJsonCityResp, 'expected cities from Json');
        done();
      },
      done.fail
    );
    expect(httpClientSpy.get.calls.count()).toBe(1, 'one call');
  });

  it('should return Weather details with city (HttpClient called once)', (done: DoneFn) => {  
    httpClientSpy.get.and.returnValue(of(expectedWeatherResp));  
    weatherService.getWeatherByCity('Ambatur').subscribe(
      resp => {
        expect(resp).toEqual(expectedWeatherResp, 'expected Weather details with city name');
        done();
      },
      done.fail
    );
    expect(httpClientSpy.get.calls.count()).toBe(1, 'one call');
  });

  it('should return Weather details with coordinates (HttpClient called once)', (done: DoneFn) => {  
    httpClientSpy.get.and.returnValue(of(expectedWeatherResp));  
    weatherService.getWeatherByCoord(80.1578,13.0741).subscribe(
      resp => {
        expect(resp).toEqual(expectedWeatherResp, 'expected Weather details with coordinates');
        done();
      },
      done.fail
    );
    expect(httpClientSpy.get.calls.count()).toBe(1, 'one call');
  });
});


