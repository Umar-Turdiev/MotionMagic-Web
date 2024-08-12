import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';

import { ViewportEventSharedService } from 'src/app/services/viewport-event-shared-service';

@Component({
  selector: 'textbox-up-down',
  templateUrl: './textbox-up-down.component.html',
  styleUrls: ['./textbox-up-down.component.css', '../../../styles.css'],
})
export class TextboxUpDownComponent {
  @Input() public width: string = '100%';
  @Input() public delta: number = 1;
  @Output() public valueChanged = new EventEmitter<number>();

  protected _trueValue: string = '';
  protected _displayValue: string = '';
  private previousValue: string = ''; // Used to store the previous valid value.

  constructor(private viewportEventSharedService: ViewportEventSharedService) {}

  ngOnInit(): void {
    this.viewportEventSharedService.getBeforeClickSignal$().subscribe(() => {
      // This seem to be causing issues when the viewport is selected.
      // this.updateValue();
    });
  }

  @Input() isPositiveOnly: boolean = false;
  @Input() limitValue: number = 0;

  @Input()
  set value(newValue: string) {
    this._trueValue = newValue;
    this._displayValue = this.decimalLimiter(this._trueValue);
    this.previousValue = newValue;
  }

  get value(): string {
    return this._trueValue;
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    event.preventDefault();
    this.updateValue();
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    event.preventDefault();

    this._trueValue == this.previousValue;
    this._displayValue = this.decimalLimiter(this._trueValue);
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    // When the input loses focus, update the value.
    this.updateValue();
  }

  private sanitizeInput(input: string): string {
    // Use a regex to allow only specified characters.
    return input.replace(/[^1234567890+\-*/.()]/g, '');
  }

  private evaluateExpression(expression: string): number | undefined {
    try {
      return (this.isPositiveOnly && eval(expression)<=this.limitValue)? this.limitValue + 1 : eval(expression);
    } catch (error) {
      return undefined;
    }
  }

  updateValue(): void {
    const sanitizedValue: string = this.sanitizeInput(this._displayValue);
    const result: number | undefined = this.evaluateExpression(sanitizedValue);

    if (result !== undefined && result !== Infinity) {
      this._trueValue = result.toString();
      if(this._trueValue !== this.previousValue){
        this.previousValue = this._trueValue;
        this._displayValue = this.decimalLimiter(this._trueValue);
        this.valueChanged.emit(result);
      }else{
        this._displayValue = this.decimalLimiter(this._trueValue);
      }
    } else {
      // If evaluation failed, revert to the previous valid value.
      this._trueValue = this.previousValue;
      this._displayValue = this.decimalLimiter(this._trueValue);
    }
  }

  increment(): void {
    this._trueValue = String(Number(this._displayValue) + this.delta);
    this._displayValue = this.decimalLimiter(this._trueValue);
    this.updateValue();
  }

  decrement(): void {
    this._trueValue = String(Number(this._displayValue) - this.delta);
    this._displayValue = this.decimalLimiter(this._trueValue);
    this.updateValue();
  }

  decimalLimiter(value: string): string {
    //This will automatically round the the number to the third decimal
    const floatValue = parseFloat(value).toFixed(3);
    const splitValue = floatValue.split('.');

    let decimals: string[] = [];
    let result = splitValue[0];

    let lastNumberIsZero: boolean = true;

    for (let index = 2; index >= 0; index--) {
      if (parseInt(splitValue[1].at(index)!) === 0) {
        if (lastNumberIsZero) {
          continue;
        }
      }
      decimals.push(splitValue[1].at(index)!);
      lastNumberIsZero = false;
    }

    if (decimals.length > 0) {
      result += '.';
    }

    decimals.reverse().forEach((decimal) => {
      result += decimal;
    });

    return result;
  }
}
