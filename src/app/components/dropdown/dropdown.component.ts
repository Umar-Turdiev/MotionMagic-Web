import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css', '../../../styles.css'],
})
export class DropdownComponent {
  @Input() public width: string = 'auto';
  @Input() public selectedValue: string = '';
  @Output() public selectedValueChange = new EventEmitter<string>();

  onValueChange(newValue: string) {
    this.selectedValue = newValue;
    this.selectedValueChange.emit(newValue);
  }
}
