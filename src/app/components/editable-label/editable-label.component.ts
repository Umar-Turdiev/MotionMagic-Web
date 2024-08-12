import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'editable-label',
  templateUrl: './editable-label.component.html',
  styleUrls: ['./editable-label.component.css'],
})
export class EditableLabelComponent {
  @Input() fontSize: string = '16px';
  @Input() externalClasses: string = ''; // External CSS classes
  @Input() value: string = '';
  @Output() valueChanged: EventEmitter<string> = new EventEmitter<string>();

  private originalValue: string = '';

  @ViewChild('labelInput') labelInput!: ElementRef;

  isEditing: boolean = false;

  constructor() {}

  enterEditMode() {
    this.isEditing = true;
    this.originalValue = this.value;
    setTimeout(() => {
      // Focus after the view is updated
      this.labelInput.nativeElement.focus();
    });
  }

  exitEditMode() {
    if(this.isEditing){
      this.isEditing = false;
      if(this.originalValue !== this.value){
        this.valueChanged.emit(this.value);
      }
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.exitEditMode();
    }
  }
}
