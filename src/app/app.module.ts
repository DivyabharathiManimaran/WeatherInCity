import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatDividerModule} from '@angular/material/divider';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AgmCoreModule } from '@agm/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';



import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WeatherComponent } from '../app/weather-component/weather-component';
import { FocusDirective } from './weather-component/directives/auto-focus.directive';

@NgModule({
  declarations: [
    AppComponent,
    WeatherComponent,
    FocusDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FlexLayoutModule,
    MatFormFieldModule,
    FormsModule, 
    ReactiveFormsModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    AppRoutingModule,
    FontAwesomeModule,
    MatAutocompleteModule,
    AgmCoreModule.forRoot({
      apiKey:'AIzaSyChmU90nvmA0JJkDtOrCDn5-IFZO5fX6gw'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
