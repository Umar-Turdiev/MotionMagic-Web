import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'underline-dropdown',
  templateUrl: './underline-dropdown.component.html',
  styleUrls: ['./underline-dropdown.component.css', '../../../styles.css'],
})
export class UnderlineDropdownComponent {
  @Input() public width: string = 'auto';
  @Input() public selectedValue: string = '';
  @Output() public selectedValueChange = new EventEmitter<string>();

  onValueChange(newValue: string) {
    this.selectedValue = newValue;
    this.selectedValueChange.emit(newValue);
  }
}
