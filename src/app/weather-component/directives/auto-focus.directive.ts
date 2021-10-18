import { Directive, AfterViewInit, ElementRef } from '@angular/core';

@Directive({
  selector: '[appFocus]'
})
export class FocusDirective implements AfterViewInit {
  constructor(private host: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(()=> {
      this.host.nativeElement.focus();
    },100)
  } 
}