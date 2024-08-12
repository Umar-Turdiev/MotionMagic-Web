import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'underline-textbox',
  templateUrl: './underline-textbox.component.html',
  styleUrls: ['./underline-textbox.component.css', '../../../styles.css'],
})
export class UnderlineTextboxComponent {
  @Input() public title: string = '';
  @Input() public width: string = '100%';
  @Input() public height: string = 'fit-content';
  @Input() public min: number | null = null;
  @Input() public max: number | null = null;
  @Input() public maxLength: number | null = null;
  @Input() public stringInput: boolean = false;
  private _value: number | string = 0;
  private previousValue: number | string = 0;
  @Output() public valueChange = new EventEmitter<number>();
  @Output() public stringValueChange = new EventEmitter<string>();

  @Input()
  set value(newValue: number | string) {
    this._value = newValue;
    this.correctValue();
  }

  get value(): number | string {
    return this._value;
  }

  @HostListener('keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    event.preventDefault();
    this.correctValue();
    this.emitValue();
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    this.correctValue();
    this.emitValue();
  }

  ngOnInit(): void {
    this.previousValue = this._value;
  }

  private parseValue(input: string | null): number | null {
    if (!input) {
      return null;
    }

    const parsedValue = parseInt(input, 10);

    if (!isNaN(parsedValue)) {
      return parsedValue;
    }

    return null;
  }

  private isWithinRange(value: number): boolean {
    if (this.min !== null && value < this.min) {
      return false;
    }

    if (this.max !== null && value > this.max) {
      return false;
    }

    return true;
  }

  private correctValue(): void {
    if (this.stringInput) {
      return;
    }

    const parsedValue = this.parseValue(this._value?.toString());

    if (parsedValue !== null && this.isWithinRange(parsedValue)) {
      this.previousValue = parsedValue;
      this._value = parsedValue;
    } else {
      this._value = this.previousValue;
    }
  }

  private emitValue(): void {
    if (this.stringInput) {
      this.stringValueChange.emit(this._value.toString());
    } else {
      const numericValue = Number(this._value);
      if (!isNaN(numericValue)) {
        this.valueChange.emit(numericValue);
      }
    }
  }
}
