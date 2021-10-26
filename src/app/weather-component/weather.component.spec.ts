import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Directive, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BehaviorSubject, interval, Observable, of, Subscription } from 'rxjs';

import { SESSION_STORAGE } from 'ngx-webstorage-service';
import { WeatherComponent } from './weather.component';
import { WeatherUtilityService } from './service/weather-utility.service';
import { CityData, DisplayWeather, WeatherResponse } from './model/weather-response.model';

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
    return of({});
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

  // getCitiesFromJson: () => ({ subscribe: (f: (arg0: {}) => any) => f({}) }),
  // getWeatherByCoord: (arg1:number, arg2:number) => ({ subscribe: (f: (arg0: {}) => any) => f({}) }),
  // getWeatherByCity: (arg1:string) => ({ subscribe: (f: (arg0: {}) => any) => f({}) }),
  // setDetails: (arg:WeatherResponse) => ({subscribe: (f: (arg0: {}) => any) => f({})})
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
describe('WeatherComponent', () => {
  let fixture:ComponentFixture<WeatherComponent>;
  let component:WeatherComponent;
  let latitude:number = 10;
  let longitude:number  = 10;
  let city:string = 'Berlin';

  // beforeEach(() => {
  //   TestBed.configureTestingModule({
  //     imports: [ FormsModule, ReactiveFormsModule ],
  //     declarations: [
  //       WeatherComponent,
  //       TranslatePipe, PhoneNumberPipe, SafeHtmlPipe,
  //       OneviewPermittedDirective
  //     ],
  //     schemas: [ NO_ERRORS_SCHEMA ],
  //     providers: [
  //       { provide: 'SESSION_STORAGE', useValue: SESSION_STORAGE },
  //       { provide: WeatherUtilityService, useValue: weathersServiceStub }
  //     ]
  //   });
  //   // .overrideComponent(WeatherComponent, {}).compileComponents();
  //   fixture = TestBed.createComponent(WeatherComponent);
  //   component = fixture.debugElement.componentInstance;
  // });

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
    spyOn(locationStub, "watchPosition").and.callThrough();
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


  // describe("ngOnInit without city in storage", () => {
  //   it('should run ngOnInit()', async () => {
  //       component.storage.clear('cityName');
  //       component.ngOnInit();
  //       expect(component.filter).toBeDefined();
  //       expect(component.filteredOptions).toBeDefined();
  //       // spyOn(locationStub, "watchPosition").and.callThrough();
  //       expect(locationStub.watchPosition).toHaveBeenCalled();
  //       expect(component.waitingLocPerm).toBeFalse();
  //       expect(component.currentLoc).toBeTrue()
  //       expect(component.errorMsg).toEqual('');     
  //       spyOn(weathersServiceStub, "getWeatherByCoord").and.callThrough();  
  //       expect(weathersServiceStub.getWeatherByCoord).toHaveBeenCalled();
  //     });
  // });

  describe("ngOnInit with city in storage", () => {
    it('should run ngOnInit()', async () => {
        component.storage.set('cityName', city);
        spyOn(weathersServiceStub, "getWeatherByCity").and.callThrough();
        component.ngOnInit();
        expect(component.filter).toBeDefined();
        expect(component.filteredOptions).toBeDefined();  
        expect(weathersServiceStub.getWeatherByCity).toHaveBeenCalled();
      });
  });

  describe("Fetch Cities List", () => {
    it('should run getCitiesFromAPI()', async () => {
      component.getCitiesFromAPI();
      expect(weathersServiceStub.getCities).toHaveBeenCalled();
      expect(weathersServiceStub.getCities).toBeTruthy();        
    });
  });

  // describe("Fetch Current Location", () => {
  //   it('should run getCurrentLocation()', async () => {      
  //     spyOn(locationStub, "watchPosition").and.callThrough();
  //     expect(locationStub.watchPosition).toHaveBeenCalled();
  //     expect(component.waitingLocPerm).toBeFalse();
  //     expect(component.errorMsg).toEqual('');
  //     expect(component.lat && component.long).toBeDefined();
      
  //     spyOn(weathersServiceStub, "getWeatherByCoord").and.callThrough();  
  //     expect(weathersServiceStub.getWeatherByCoord).toHaveBeenCalled();
  //   });
  // })

  // describe("Fetch Details with coordinates", () => {
  //   it('should run getUsingCoord()', async () => {
  //     component.getUsingCoord(latitude,longitude);
  //     spyOn(weathersServiceStub, "getWeatherByCoord").and.callThrough();
  //     expect(weathersServiceStub.getWeatherByCoord).toHaveBeenCalled();
  //     expect(component.weatherDetails).toBeDefined();
  //     // expect(weathersServiceStub.setDetails).toHaveBeenCalled();

  //     spyOn(weathersServiceStub, "getWeatherByCoord").and.throwError('error');
  //     expect(component.errorMsg).toBeDefined();
  //   });
  // })

  // it('should run searchClick()', async () => {
  //   component.searchClick(city);
  //   component.cityName = 'delhi';
  //   if(component.cityName !== city) {
  //     expect(component.cityTimerSubs).toBeUndefined();
  //     expect(locationStub.clearWatch).toHaveBeenCalled();
  //   }
  // });

  // it('should run #search()', async () => {
  //   component.search(city);
  //   spyOn(weathersServiceStub, "getWeatherByCity").and.callThrough();
  //   expect(weathersServiceStub.getWeatherByCity).toHaveBeenCalled();
  // });

  // describe('Get details by city name', () => {
  //   it('should run #fetchByCity()', async () => {
  //     component.fetchByCity(city)
  //     spyOn(weathersServiceStub, 'getWeatherByCity').and.callThrough();
  //     expect(component.weatherDetails).toBeDefined();
  //     expect(component.currentLoc).toBeFalse();
  //     expect(component.waitingLocPerm).toBeFalse();
  //     expect(component.accessDenied).toBeFalse();
  //     expect(component.errorMsg).toEqual('');
  //     expect(component.setCoord).toHaveBeenCalledWith(latitude,longitude);
  //     expect(weathersServiceStub.setDetails).toHaveBeenCalled();

  //     spyOn(weathersServiceStub, "getWeatherByCity").and.throwError('error');
  //     expect(component.clearPrevSubs).toHaveBeenCalled();
  //     expect(component.cityTimerSubs).toBeUndefined();
  //     expect(navigator.geolocation.clearWatch).toHaveBeenCalled();
  //     });
  // })

  it('should run setMapCoords()', async () => {
    component.setMapCoords({ coords: {lat : latitude, lng : longitude }});
    // expect(component.clearPrevSubs).toHaveBeenCalled();
    // expect(component.cityTimerSubs).toBeUndefined();
    // expect(locationStub.clearWatch).toHaveBeenCalled();
    
    expect(component.lat && component.long).toBeDefined();
    if(latitude && longitude) {
      spyOn(weathersServiceStub, "getWeatherByCoord").and.callThrough();  
      // expect(weathersServiceStub.getWeatherByCoord).toHaveBeenCalled();
    }
    else expect(component.errorMsg).toEqual('Unable to fetch results!');
  });

  it('should run #setCoord()', async () => {
    component.setCoord(latitude,longitude);
    expect(component.lat && component.long).toBeDefined();
  });

  // it('should run #clearPrevSubs()', async () => {
  //   component.clearPrevSubs();
  //   expect(component.cityTimerSubs).toBeUndefined();
  //   expect(navigator.geolocation.clearWatch).toHaveBeenCalled();
  // });

  // it('should run #ngOnDestroy()', async () => {
  //   component.ngOnDestroy();
  //   expect(component.clearPrevSubs).toHaveBeenCalled();
  //   expect(component.cityTimerSubs).toBeUndefined();
  //   expect(navigator.geolocation.clearWatch).toHaveBeenCalled();
  //   expect(component.citySubs).toBeUndefined();
  //   expect(component.weatherDetSubs).toBeUndefined();;
  //   expect(component.coordSubs).toBeUndefined();;
  // });

});